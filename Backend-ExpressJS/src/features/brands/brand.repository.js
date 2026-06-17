import prisma from '../../config/prisma.js';

export const brandRepository = {
  async findAll() {
    return prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { brandName: 'asc' },
    });
  },

  async findById(id) {
    return prisma.brand.findUnique({ where: { id } });
  },

  async create(data) {
    return prisma.brand.create({ data });
  },

  async update(id, data) {
    return prisma.brand.update({ where: { id }, data });
  },

  async toggle(id, isActive) {
    return prisma.brand.update({ where: { id }, data: { isActive } });
  },
};
