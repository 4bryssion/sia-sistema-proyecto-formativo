import prisma from '../../config/prisma.js';

export const taskRepository = {
  async findAll() {
    return prisma.task.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, userFirstName: true, userLastName: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  },

  async findByUser(userId) {
    return prisma.task.findMany({
      where: { userId, isActive: true },
      orderBy: { created_at: 'desc' },
    });
  },

  async findById(id) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, userFirstName: true, userLastName: true } },
      },
    });
  },

  async create(data) {
    return prisma.task.create({
      data,
      include: {
        user: { select: { id: true, userFirstName: true, userLastName: true } },
      },
    });
  },

  async update(id, data) {
    return prisma.task.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, userFirstName: true, userLastName: true } },
      },
    });
  },

  async toggle(id, isActive) {
    return prisma.task.update({
      where: { id },
      data: { isActive },
      include: {
        user: { select: { id: true, userFirstName: true, userLastName: true } },
      },
    });
  },
};
