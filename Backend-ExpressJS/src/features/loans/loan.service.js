import { loanRepository } from './loan.repository.js';
import prisma from '../../config/prisma.js';
import { checkAvailability } from './loan.stock.js';

const assertUniqueMaterials = (materials) => {
  const ids = materials.map((m) => m.materialId);
  if (new Set(ids).size !== ids.length) {
    throw new Error('No se puede repetir el mismo material en un préstamo.');
  }
};

export const loanService = {
  async getAll(status) {
    return loanRepository.findAll(status);
  },

  async getById(id) {
    const loan = await loanRepository.findById(id);
    if (!loan) throw new Error('Préstamo no encontrado.');
    return loan;
  },

  async create(data) {
    assertUniqueMaterials(data.materials);
    for (const m of data.materials) {
      const material = await prisma.consumableMaterial.findUnique({ where: { id: m.materialId } });
      if (!material) throw new Error(`El material ${m.materialId} no existe.`);
      const err = checkAvailability(material, m.borrowedQuantity, 0);
      if (err) throw new Error(err);
    }
    return loanRepository.create({
      header: {
        apprenticeGroup: data.apprenticeGroup,
        useJustification: data.useJustification,
        returnDate: new Date(data.returnDate),
      },
      materials: data.materials,
      parties: { lenderId: data.lenderId, receiverId: data.receiverId },
    });
  },

  async toggle(id) {
    const loan = await loanService.getById(id);
    const lines = loan.materials.map((lm) => ({
      materialId: lm.materialId,
      borrowedQuantity: lm.borrowedQuantity,
    }));
    // Reactivar exige stock disponible para volver a prestar
    if (!loan.isActive) {
      for (const lm of loan.materials) {
        const material = await prisma.consumableMaterial.findUnique({ where: { id: lm.materialId } });
        const err = checkAvailability(material, lm.borrowedQuantity, 0);
        if (err) throw new Error(err);
      }
    }
    return loanRepository.toggle(id, !loan.isActive, lines);
  },

  async update(id, data) {
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { materials: { include: { loanReturns: true } } },
    });
    if (!loan) throw new Error('Préstamo no encontrado.');
    if (loan.status !== 'Activo') {
      throw new Error('Solo los préstamos en estado Activo pueden actualizarse.');
    }
    if (loan.materials.some((lm) => lm.loanReturns && lm.loanReturns.length > 0)) {
      throw new Error('No se puede editar un préstamo con devoluciones registradas.');
    }

    assertUniqueMaterials(data.materials);

    const ownedMap = new Map(loan.materials.map((lm) => [lm.materialId, lm.borrowedQuantity]));
    for (const m of data.materials) {
      const material = await prisma.consumableMaterial.findUnique({ where: { id: m.materialId } });
      if (!material) throw new Error(`El material ${m.materialId} no existe.`);
      const owned = ownedMap.get(m.materialId) ?? 0;
      const err = checkAvailability(material, m.borrowedQuantity, owned);
      if (err) throw new Error(err);
    }

    return loanRepository.update(id, {
      header: {
        apprenticeGroup: data.apprenticeGroup,
        useJustification: data.useJustification,
        returnDate: new Date(data.returnDate),
        ...(data.status ? { status: data.status } : {}),
      },
      oldMaterials: loan.materials.map((lm) => ({
        materialId: lm.materialId,
        borrowedQuantity: lm.borrowedQuantity,
      })),
      newMaterials: data.materials,
      parties: { lenderId: data.lenderId, receiverId: data.receiverId },
    });
  },
};
