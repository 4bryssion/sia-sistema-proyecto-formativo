import prisma from '../../config/prisma.js';

const includeRelations = {
  loan: {
    select: {
      id: true,
      loanDate: true,
      returnDate: true,
      borrowedQuantity: true,
      apprenticeGroup: true,
      useJustification: true,
      user: { select: { id: true, userFirstName: true, userLastName: true } },
    },
  },
  consumableMaterial: { select: { id: true, materialName: true, status: true } },
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

  async createWithStatusRestore(data, materialId) {
    return prisma.$transaction([
      prisma.loanReturn.create({ data, include: includeRelations }),
      prisma.consumableMaterial.update({
        where: { id: materialId },
        data: { status: 'Disponible' },
      }),
    ]);
  },

  async toggle(id, isActive) {
    return prisma.loanReturn.update({
      where: { id },
      data: { isActive },
      include: includeRelations,
    });
  },
};
