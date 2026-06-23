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

  async create(data) {
    for (const m of data.materials) {
      const material = await prisma.consumableMaterial.findUnique({ where: { id: m.materialId } });
      if (!material) throw new Error(`El material ${m.materialId} no existe.`);
      if (material.status !== 'Disponible') {
        throw new Error(`El material ${material.materialName} no está disponible (estado: ${material.status}).`);
      }
    }

    const header = {
      apprenticeGroup: data.apprenticeGroup,
      useJustification: data.useJustification,
      returnDate: new Date(data.returnDate),
    };
    return loanRepository.create({
      header,
      materials: data.materials,
      parties: { lenderId: data.lenderId, receiverId: data.receiverId },
    });
  },

  async toggle(id) {
    const loan = await loanService.getById(id);
    const materialIds = loan.materials.map((lm) => lm.materialId);
    return loanRepository.toggle(id, !loan.isActive, materialIds);
  },
};
