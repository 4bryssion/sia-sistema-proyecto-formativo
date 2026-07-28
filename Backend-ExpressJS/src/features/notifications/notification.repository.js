import prisma from '../../config/prisma.js';

export const notificationRepository = {
  findAll() {
    return prisma.notification.findMany({
      where: { isActive: true },
      orderBy: { created_at: 'desc' },
      include: { user: { select: { id: true, userFirstName: true, userLastName: true } } },
    });
  },

  findById(id) {
    return prisma.notification.findUnique({
      where: { id },
      include: { user: { select: { id: true, userFirstName: true, userLastName: true } } },
    });
  },

  create(data) {
    return prisma.notification.create({ data });
  },
};
