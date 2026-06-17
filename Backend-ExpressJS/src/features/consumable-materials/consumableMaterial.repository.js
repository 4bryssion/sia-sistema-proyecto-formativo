import prisma from '../../config/prisma.js';

const includeRelations = {
  user: { select: { id: true, userFirstName: true, userLastName: true, userAccountType: true } },
  brand: { select: { id: true, brandName: true } },
};

export const consumableMaterialRepository = {
  async findAll() {
    return prisma.consumableMaterial.findMany({
      where: { returnable: null },
      include: includeRelations,
      orderBy: { materialName: 'asc' },
    });
  },

  async findById(id) {
    return prisma.consumableMaterial.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  async create(data) {
    return prisma.consumableMaterial.create({
      data,
      include: includeRelations,
    });
  },

  async update(id, data) {
    return prisma.consumableMaterial.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  async delete(id) {
    return prisma.consumableMaterial.delete({ where: { id } });
  },
};
