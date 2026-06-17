import { loanRepository } from './loan.repository.js';
import prisma from '../../config/prisma.js';

export const loanService = {
  async getAll() {
    return loanRepository.findAll();
  },

  async getById(id) {
    const loan = await loanRepository.findById(id);
    if (!loan) throw new Error('Préstamo no encontrado.');
    return loan;
  },

  async create(bodyData) {
    const data = {
      ...bodyData,
      userId: Number(bodyData.userId),
      materialId: Number(bodyData.materialId),
      borrowedQuantity: Number(bodyData.borrowedQuantity),
      apprenticeGroup: Number(bodyData.apprenticeGroup),
      returnDate: bodyData.returnDate
        ? new Date(bodyData.returnDate).toISOString()
        : undefined,
    };

    const material = await prisma.consumableMaterial.findUnique({
      where: { id: data.materialId },
    });

    if (!material) throw new Error('El material especificado no existe.');
    if (material.status !== 'Disponible') {
      throw new Error(`El material no está disponible para préstamo. Estado actual: ${material.status}`);
    }

    const [loan] = await loanRepository.createWithStatusChange(data, data.materialId);
    return loan;
  },

  async update(id, bodyData) {
    await loanService.getById(id);

    const data = { ...bodyData };
    if (data.userId) data.userId = Number(data.userId);
    if (data.materialId) data.materialId = Number(data.materialId);
    if (data.borrowedQuantity) data.borrowedQuantity = Number(data.borrowedQuantity);
    if (data.apprenticeGroup) data.apprenticeGroup = Number(data.apprenticeGroup);
    if (data.returnDate) data.returnDate = new Date(data.returnDate).toISOString();

    return loanRepository.update(id, data);
  },

  async delete(id) {
    const loan = await loanService.getById(id);
    return loanRepository.deleteWithStatusRestore(id, loan.materialId);
  },
};
