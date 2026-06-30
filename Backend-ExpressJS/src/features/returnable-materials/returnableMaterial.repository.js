import prisma from '../../config/prisma.js';

const includeComplete = {
  consumableMaterial: {
    include: {
      user: { select: { id: true, userFirstName: true, userLastName: true, userAccountType: true } },
      brand: { select: { id: true, brandName: true } },
    },
  },
  category: { select: { id: true, categoryName: true } },
};

export const returnableMaterialRepository = {
  async findAll(status = 'active') {
    const where = {};
    if (status === 'active')   where.consumableMaterial = { isActive: true };
    if (status === 'inactive') where.consumableMaterial = { isActive: false };
    return prisma.returnableMaterial.findMany({
      where,
      include: includeComplete,
      orderBy: { consumableMaterial: { materialName: 'asc' } },
    });
  },

  async findById(id) {
    return prisma.returnableMaterial.findUnique({
      where: { id },
      include: includeComplete,
    });
  },

  async create(consumableData, returnableData) {
    return prisma.consumableMaterial.create({
      data: {
        ...consumableData,
        returnable: { create: returnableData },
      },
      include: {
        returnable: { include: { category: true } },
        user: { select: { id: true, userFirstName: true, userLastName: true } },
        brand: true,
      },
    });
  },

  async update(id, consumableData, returnableData) {
    return prisma.consumableMaterial.update({
      where: { id },
      data: {
        ...consumableData,
        ...(Object.keys(returnableData).length > 0 && {
          returnable: { update: returnableData },
        }),
      },
      include: {
        returnable: { include: { category: true } },
        user: { select: { id: true, userFirstName: true, userLastName: true } },
        brand: true,
      },
    });
  },

  async toggle(id, isActive) {
    await prisma.consumableMaterial.update({
      where: { id },
      data: { isActive },
    });
    return prisma.returnableMaterial.findUnique({
      where: { id },
      include: includeComplete,
    });
  },
};
