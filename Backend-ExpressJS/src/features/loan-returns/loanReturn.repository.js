import prisma from '../../config/prisma.js';

const includeRelations = {
  loanMaterial: {
    select: {
      borrowedQuantity: true,
      loan: {
        select: { id: true, loanDate: true, returnDate: true, apprenticeGroup: true, useJustification: true },
      },
      consumableMaterial: {
        select: { id: true, materialName: true, status: true },
      },
    },
  },
};

export const loanReturnRepository = {
  async findAll() {
    return prisma.loanReturn.findMany({
      where: { isActive: true },
      include: includeRelations,
      orderBy: { returnDate: 'desc' },
    });
  },

  async findById(id) {
    return prisma.loanReturn.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  // data: { loanId, materialId, remainingQuantity, observations }
  // restore: { type: 'quantity', qty } | { type: 'serialized', status }
  async createWithRestore(data, restore) {
    return prisma.$transaction(async (tx) => {
      const loanReturn = await tx.loanReturn.create({ data, include: includeRelations });

      const material = await tx.consumableMaterial.findUnique({ where: { id: data.materialId } });
      if (restore.type === 'serialized') {
        // El estado elegido por el validador ES el nuevo estado del material (RFADMIN21).
        await tx.consumableMaterial.update({
          where: { id: material.id },
          data: { status: restore.status },
        });
      } else {
        // Reintegra SOLO el sobrante; si estaba En_prestamo y vuelve a haber stock → Disponible.
        const newQty = material.quantity + restore.qty;
        await tx.consumableMaterial.update({
          where: { id: material.id },
          data: {
            quantity: newQty,
            ...(material.status === 'En_prestamo' && newQty > 0 ? { status: 'Disponible' } : {}),
          },
        });
      }

      // Finalizar el préstamo si ya no quedan materiales sin retorno activo
      const totalLines = await tx.loanMaterial.count({ where: { loanId: data.loanId } });
      const returned = await tx.loanReturn.count({ where: { loanId: data.loanId, isActive: true } });
      if (returned === totalLines) {
        await tx.loan.update({ where: { id: data.loanId }, data: { status: 'Finalizado' } });
      }

      return loanReturn;
    });
  },

  async toggle(id, isActive) {
    return prisma.loanReturn.update({
      where: { id },
      data: { isActive },
      include: includeRelations,
    });
  },
};
