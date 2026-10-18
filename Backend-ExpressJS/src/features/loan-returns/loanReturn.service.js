import { loanReturnRepository } from './loanReturn.repository.js';
import prisma from '../../config/prisma.js';
import { accessService } from '../access/access.service.js';
import { clausulaParticipacion, participaEnPrestamo } from '../../shared/participacionEnPrestamo.js';

// (p52) Quien ve los retornos de TODO el mundo. Es el mismo permiso y el mismo
// criterio que en devoluciones (RFINV14); este modulo se habia quedado sin el,
// asi que cualquiera con `list_loan_returns` —el Invitado incluido— veia los
// retornos de los prestamos de los demas.
const PERMISO_VER_TODOS = 'list_all_loan_returns';

const recorteSegunActor = async (actor) => {
  if (await accessService.hasPermission(actor.id, PERMISO_VER_TODOS)) return undefined;
  return clausulaParticipacion(actor);
};

export const loanReturnService = {
  async getAll(actor) {
    return loanReturnRepository.findAll(await recorteSegunActor(actor));
  },

  async getById(id, actor) {
    const loanReturn = await loanReturnRepository.findById(id);
    if (!loanReturn) throw new Error('Retorno no encontrado.');

    // Mismo criterio que en prestamos y devoluciones: se responde como si no
    // existiera, porque decir «ese no es tuyo» ya confirma que existe.
    if (await accessService.hasPermission(actor.id, PERMISO_VER_TODOS)) return loanReturn;
    if (participaEnPrestamo(loanReturn.loanMaterial?.loan, actor)) return loanReturn;
    throw new Error('Retorno no encontrado.');
  },

  async create(bodyData, actor) {
    const loanId = Number(bodyData.loanId);
    const materialId = Number(bodyData.materialId);

    // 1. Préstamo existe y activo
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      // (p52) Las firmas, para saber de quien es el prestamo.
      include: { signatures: { select: { userId: true, externalEmail: true } } },
    });
    if (!loan || !loan.isActive) throw new Error('El préstamo especificado no existe.');

    // (p52) Retornar lo de otro. No se comprobaba: con `create_loan_return` y un
    // id cualquiera —y los ids son consecutivos— se registraba un retorno a
    // nombre de un tercero, y cada retorno SUMA stock. Es la misma comprobacion
    // que ya hacia devoluciones, con el mismo criterio: quien ve los prestamos
    // de todos puede registrarlo por cuenta ajena, que es el trabajo de quien
    // atiende el almacen; quien solo ve los suyos, solo los suyos.
    const puedeVerTodos = await accessService.hasPermission(actor.id, 'list_all_loans');
    if (!puedeVerTodos && !participaEnPrestamo(loan, actor)) {
      throw new Error('El préstamo especificado no existe.');
    }

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
    return created;
  },

  // (p52) Solo desactiva, y al desactivar deshace el reintegro de stock. El
  // porque de que no se reactive esta en el repositorio.
  async desactivar(id, actor) {
    const record = await loanReturnService.getById(id, actor);
    if (!record.isActive) {
      throw new Error('El retorno ya esta desactivado: para rehacerlo, registrelo de nuevo.');
    }
    return loanReturnRepository.desactivar(id);
  },
};
