import prisma from '../../config/prisma.js';

const includeRelations = {
  user: { select: { id: true, userFirstName: true, userLastName: true, userAccountType: true } },
  brand: { select: { id: true, brandName: true } },
};

export const consumableMaterialRepository = {
  async findAll(isActiveFilter) {
    const where = { returnable: null };
    if (isActiveFilter !== undefined) where.isActive = isActiveFilter;
    return prisma.consumableMaterial.findMany({
      where,
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

  async toggle(id, isActive) {
    return prisma.consumableMaterial.update({
      where: { id },
      data: { isActive },
      include: includeRelations,
    });
  },
};
