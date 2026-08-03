import prisma from '../../config/prisma.js';
import { applyLend, applyRestore } from './loan.stock.js';

const loanInclude = {
  // `returnable` se trae solo para saber de qué TIPO es cada material: la
  // herencia de tabla hace que un devolutivo sea un consumable_materials con
  // fila hermana en returnable_materials, y sin este dato el cliente no puede
  // distinguirlos (el formulario de préstamo y los retornos etiquetan por tipo).
  // Se pide solo el id para no arrastrar toda la fila.
  materials: {
    include: {
      consumableMaterial: {
        include: { returnable: { select: { id: true } } },
      },
    },
  },
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

  // Marca la firma de una parte; si ambas quedan firmadas, el préstamo pasa a Activo.
  async sign(loanId, party) {
    return prisma.$transaction(async (tx) => {
      await tx.loanSignature.update({
        where: { loanId_party: { loanId, party } },
        data: { signed: true, signedAt: new Date() },
      });
      const pending = await tx.loanSignature.count({ where: { loanId, signed: false } });
      if (pending === 0) {
        await tx.loan.update({ where: { id: loanId }, data: { status: 'Activo' } });
      }
      return tx.loan.findUnique({ where: { id: loanId }, include: loanInclude });
    });
  },
};
