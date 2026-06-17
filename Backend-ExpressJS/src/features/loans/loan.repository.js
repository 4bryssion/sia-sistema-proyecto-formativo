import prisma from '../../config/prisma.js';

const includeRelations = {
  user: { select: { id: true, userFirstName: true, userLastName: true, userPhone: true, userEmail: true, userAddress: true } },
  consumableMaterial: { select: { id: true, materialName: true, status: true } },
};

export const loanRepository = {
  async findAll() {
    return prisma.loan.findMany({
      include: includeRelations,
      orderBy: { loanDate: 'desc' },
    });
  },

  async findById(id) {
    return prisma.loan.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  async createWithStatusChange(data, materialId) {
    return prisma.$transaction([
      prisma.loan.create({ data, include: includeRelations }),
      prisma.consumableMaterial.update({
        where: { id: materialId },
        data: { status: 'En_prestamo' },
      }),
    ]);
  },

  async update(id, data) {
    return prisma.loan.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  async deleteWithStatusRestore(id, materialId) {
    return prisma.$transaction([
      prisma.loan.delete({ where: { id } }),
      prisma.consumableMaterial.update({
        where: { id: materialId },
        data: { status: 'Disponible' },
      }),
    ]);
  },
};
