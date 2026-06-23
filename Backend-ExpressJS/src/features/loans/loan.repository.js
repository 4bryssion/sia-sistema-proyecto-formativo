import prisma from '../../config/prisma.js';

export const loanRepository = {
  async findAll() {
    return prisma.loan.findMany({
      where: { isActive: true },
      orderBy: { loanDate: 'desc' },
      include: {
        materials: { include: { consumableMaterial: true } },
        signatures: { include: { user: true } },
      },
    });
  },

  async findById(id) {
    return prisma.loan.findUnique({
      where: { id },
      include: {
        materials: { include: { consumableMaterial: true } },
        signatures: { include: { user: true } },
      },
    });
  },

  // header: { apprenticeGroup, useJustification, returnDate }
  // materials: [{ materialId, borrowedQuantity }, ...]
  // parties: { lenderId, receiverId }
  async create({ header, materials, parties }) {
    const materialIds = materials.map((m) => m.materialId);
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

      await tx.consumableMaterial.updateMany({
        where: { id: { in: materialIds } },
        data: { status: 'En_prestamo' },
      });

      return tx.loan.findUnique({
        where: { id: loan.id },
        include: {
          materials: { include: { consumableMaterial: true } },
          signatures: { include: { user: true } },
        },
      });
    });
  },

  async toggle(id, isActive, materialIds) {
    const materialStatus = isActive ? 'En_prestamo' : 'Disponible';
    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.update({ where: { id }, data: { isActive } });
      if (materialIds.length) {
        await tx.consumableMaterial.updateMany({
          where: { id: { in: materialIds } },
          data: { status: materialStatus },
        });
      }
      return loan;
    });
  },
};
