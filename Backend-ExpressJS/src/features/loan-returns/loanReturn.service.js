import { loanReturnRepository } from './loanReturn.repository.js';
import { notify } from '../notifications/notification.service.js';
import prisma from '../../config/prisma.js';

export const loanReturnService = {
  async getAll() {
    return loanReturnRepository.findAll();
  },

  async getById(id) {
    const loanReturn = await loanReturnRepository.findById(id);
    if (!loanReturn) throw new Error('Retorno no encontrado.');
    return loanReturn;
  },

  async create(bodyData) {
    const loanId = Number(bodyData.loanId);
    const materialId = Number(bodyData.materialId);

    // 1. Préstamo existe y activo
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan || !loan.isActive) throw new Error('El préstamo especificado no existe.');

    // 2. Guard de estado (mismo formato que el de editar)
    if (loan.status !== 'Activo') {
      throw new Error(`Solo los préstamos en estado Activo pueden retornarse. Estado actual: ${loan.status}.`);
    }

    // 3. El material pertenece al préstamo
    const loanMaterial = await prisma.loanMaterial.findUnique({
      where: { loanId_materialId: { loanId, materialId } },
    });
    if (!loanMaterial) throw new Error('El material no pertenece a este préstamo.');

    // 4. No hay retorno previo ACTIVO para ese (loanId, materialId) — la tabla no tiene unique
    // compuesto, esta validación es la barrera.
    const existingReturn = await prisma.loanReturn.findFirst({
      where: { loanId, materialId, isActive: true },
    });
    if (existingReturn) throw new Error('Este material ya tiene un retorno registrado.');

    // 5. Cargar el material y ramificar por tipo (cantidad vs serializado)
    const material = await prisma.consumableMaterial.findUnique({ where: { id: materialId } });
    if (!material) throw new Error('El material especificado no existe.');

    let remainingQuantity = null;
    let restore;

    if (material.quantity != null) {
      // Por cantidad: remainingQuantity obligatoria, materialStatus se ignora.
      if (bodyData.remainingQuantity === undefined || bodyData.remainingQuantity === null) {
        throw new Error('La cantidad sobrante es obligatoria para materiales por cantidad.');
      }
      remainingQuantity = Number(bodyData.remainingQuantity);
      if (remainingQuantity < 0 || remainingQuantity > loanMaterial.borrowedQuantity) {
        throw new Error(`La cantidad sobrante no puede superar la cantidad prestada (${loanMaterial.borrowedQuantity}).`);
      }
      restore = { type: 'quantity', qty: remainingQuantity };
    } else {
      // Serializado (placa SENA): materialStatus obligatorio, remainingQuantity no aplica.
      if (!bodyData.materialStatus) {
        throw new Error('Debe indicar el estado final del material devuelto.');
      }
      restore = { type: 'serialized', status: bodyData.materialStatus };
    }

    const data = {
      loanId,
      materialId,
      remainingQuantity,
      // observations es opcional en la API (RFADMIN22) pero NOT NULL en BD (sin migración
      // disponible): se persiste como cadena vacía cuando no se envía.
      observations: bodyData.observations || '',
    };

    const created = await loanReturnRepository.createWithRestore(data, restore);
    // (P43) Log del sistema
    notify({
      title: 'Retorno de préstamo registrado',
      description: `Préstamo #${data.loanId}: material #${data.materialId} retornado`
        + (data.remainingQuantity !== undefined && data.remainingQuantity !== null
            ? ` (cantidad devuelta: ${data.remainingQuantity}).`
            : (bodyData.materialStatus ? ` (estado del material: ${bodyData.materialStatus}).` : '.')),
      severity: 'Informativa',
      module: 'loan-returns',
    });
    return created;
  },

  async toggle(id) {
    const record = await loanReturnService.getById(id);
    const updated = await loanReturnRepository.toggle(id, !record.isActive);
    notify({
      title: updated.isActive ? 'Retorno reactivado' : 'Retorno anulado',
      description: `El retorno #${id} quedó ${updated.isActive ? 'activo' : 'anulado'}.`,
      severity: updated.isActive ? 'Informativa' : 'Advertencia',
      module: 'loan-returns',
    });
    return updated;
  },
};
