import prisma from '../../config/prisma.js';
import { applyLend, applyRestore } from './loan.stock.js';

const loanInclude = {
  materials: { include: { consumableMaterial: true } },
  signatures: { include: { user: true } },
};

export const loanRepository = {
  async findAll(status = 'active') {
    const where =
      status === 'all'      ? {} :
      status === 'inactive' ? { isActive: false } :
                              { isActive: true };
    return prisma.loan.findMany({ where, orderBy: { loanDate: 'desc' }, include: loanInclude });
  },

  async findById(id) {
    return prisma.loan.findUnique({ where: { id }, include: loanInclude });
  },

  // header: { apprenticeGroup, useJustification, returnDate }
  // materials: [{ materialId, borrowedQuantity }]
  // parties: { lenderId, receiverId }
  async create({ header, materials, parties }) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({ data: header });

      await tx.loanMaterial.createMany({
        data: materials.map((m) => ({
          loanId: loan.id,
          materialId: m.materialId,
          borrowedQuantity: m.borrowedQuantity,
        })),
      });

      await tx.loanSignature.createMany({
        data: [
          { loanId: loan.id, userId: parties.lenderId, party: 'Prestador' },
          { loanId: loan.id, userId: parties.receiverId, party: 'Receptor' },
        ],
      });

      for (const m of materials) {
        const mat = await tx.consumableMaterial.findUnique({ where: { id: m.materialId } });
        await applyLend(tx, mat, m.borrowedQuantity);
      }

      return tx.loan.findUnique({ where: { id: loan.id }, include: loanInclude });
    });
  },

  // lines: [{ materialId, borrowedQuantity }] del préstamo (para restaurar/reaplicar)
  async toggle(id, isActive, lines) {
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.update({ where: { id }, data: { isActive } });
      for (const m of lines) {
        const mat = await tx.consumableMaterial.findUnique({ where: { id: m.materialId } });
        if (isActive) await applyLend(tx, mat, m.borrowedQuantity);
        else          await applyRestore(tx, mat, m.borrowedQuantity);
      }
      return tx.loan.findUnique({ where: { id }, include: loanInclude });
    });
  },

  // header: { apprenticeGroup, useJustification, returnDate, status? }
  // oldMaterials/newMaterials: [{ materialId, borrowedQuantity }]
  // parties: { lenderId, receiverId }
  async update(id, { header, oldMaterials, newMaterials, parties }) {
    return prisma.$transaction(async (tx) => {
      // 1) restaurar stock del set actual
      for (const m of oldMaterials) {
        const mat = await tx.consumableMaterial.findUnique({ where: { id: m.materialId } });
        await applyRestore(tx, mat, m.borrowedQuantity);
      }
      // 2) borrar líneas actuales y crear las nuevas
      await tx.loanMaterial.deleteMany({ where: { loanId: id } });
      await tx.loanMaterial.createMany({
        data: newMaterials.map((m) => ({
          loanId: id,
          materialId: m.materialId,
          borrowedQuantity: m.borrowedQuantity,
        })),
      });
      // 3) aplicar préstamo al set nuevo
      for (const m of newMaterials) {
        const mat = await tx.consumableMaterial.findUnique({ where: { id: m.materialId } });
        await applyLend(tx, mat, m.borrowedQuantity);
      }
      // 4) actualizar participantes (firmas)
      await tx.loanSignature.update({
        where: { loanId_party: { loanId: id, party: 'Prestador' } },
        data: { userId: parties.lenderId },
      });
      await tx.loanSignature.update({
        where: { loanId_party: { loanId: id, party: 'Receptor' } },
        data: { userId: parties.receiverId },
      });
      // 5) actualizar cabecera
      await tx.loan.update({ where: { id }, data: header });

      return tx.loan.findUnique({ where: { id }, include: loanInclude });
    });
  },
};
