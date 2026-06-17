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
  async findAll() {
    return prisma.returnableMaterial.findMany({
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

  async delete(id) {
    return prisma.consumableMaterial.delete({ where: { id } });
  },
};
