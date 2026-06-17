import prisma from '../../config/prisma.js';

export const permissionRepository = {
  async findAll() {
    return prisma.permission.findMany({
      where: { isActive: true },
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

  async toggle(id, isActive) {
    return prisma.permission.update({ where: { id }, data: { isActive } });
  },
};
