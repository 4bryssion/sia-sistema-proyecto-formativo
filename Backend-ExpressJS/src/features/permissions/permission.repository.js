import prisma from '../../config/prisma.js';

export const permissionRepository = {
  async findAll() {
    return prisma.permission.findMany({
      orderBy: { permissionName: 'asc' },
    });
  },

  async findById(id) {
    return prisma.permission.findUnique({ where: { id } });
  },

  async create(data) {
    return prisma.permission.create({ data });
  },

  async update(id, data) {
    return prisma.permission.update({ where: { id }, data });
  },

  async delete(id) {
    return prisma.permission.delete({ where: { id } });
  },
};
