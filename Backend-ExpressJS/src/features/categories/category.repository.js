import prisma from '../../config/prisma.js';

export const categoryRepository = {
  async findAll() {
    return prisma.category.findMany({ orderBy: { categoryName: 'asc' } });
  },
  async findById(id) {
    return prisma.category.findUnique({ where: { id } });
  },
  async create(data) {
    return prisma.category.create({ data });
  },
  async update(id, data) {
    return prisma.category.update({ where: { id }, data });
  },
  async delete(id) {
    return prisma.category.delete({ where: { id } });
  },
};
