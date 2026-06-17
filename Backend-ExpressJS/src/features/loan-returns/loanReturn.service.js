import { loanReturnRepository } from './loanReturn.repository.js';
import prisma from '../../config/prisma.js';

export const loanReturnService = {
  async getAll() {
    return loanReturnRepository.findAll();
  },

  async getById(id) {
    const loanReturn = await loanReturnRepository.findById(id);
    if (!loanReturn) throw new Error('Retorno de préstamo no encontrado.');
    return loanReturn;
  },

  async create(bodyData) {
    const data = {
      ...bodyData,
      loanId: Number(bodyData.loanId),
      materialId: Number(bodyData.materialId),
      remainingQuantity: bodyData.remainingQuantity !== undefined
        ? Number(bodyData.remainingQuantity)
        : null,
    };

    const loan = await prisma.loan.findUnique({ where: { id: data.loanId } });
    if (!loan) throw new Error('El préstamo especificado no existe.');

    const material = await prisma.consumableMaterial.findUnique({
      where: { id: data.materialId },
      include: { returnable: true },
    });
    if (!material) throw new Error('El material especificado no existe.');

    const isConsumable = !material.returnable;
    if (isConsumable && (data.remainingQuantity === null || data.remainingQuantity === undefined)) {
      throw new Error('La cantidad sobrante es obligatoria para materiales de consumo.');
    }

    const [loanReturn] = await loanReturnRepository.createWithStatusRestore(data, data.materialId);
    return loanReturn;
  },

  async delete(id) {
    await loanReturnService.getById(id);
    return loanReturnRepository.delete(id);
  },
};
