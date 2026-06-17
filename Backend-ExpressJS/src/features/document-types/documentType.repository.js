import prisma from '../../config/prisma.js';

export const documentTypeRepository = {
  async findAll() {
    return prisma.documentType.findMany({
      where: { isActive: true },
      orderBy: { documentName: 'asc' },
    });
  },

  async findById(id) {
    return prisma.documentType.findUnique({ where: { id } });
  },

  async create(data) {
    return prisma.documentType.create({ data });
  },

  async update(id, data) {
    return prisma.documentType.update({ where: { id }, data });
  },

  async toggle(id, isActive) {
    return prisma.documentType.update({ where: { id }, data: { isActive } });
  },
};
