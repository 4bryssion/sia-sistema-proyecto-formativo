import prisma from '../../config/prisma.js';

// Qué módulos ve cada quién. Son las dos únicas consultas del módulo.
const MODULOS_ADMIN = ['loans', 'devolutions'];

const AUTOR = {
  user: { select: { id: true, userFirstName: true, userLastName: true } },
};

export const notificationRepository = {
  /** Los últimos préstamos y devoluciones, mezclados y ordenados por fecha. */
  findForAdmins(limite) {
    return prisma.notification.findMany({
      where: { module: { in: MODULOS_ADMIN } },
      orderBy: { created_at: 'desc' },
      take: limite,
      include: AUTOR,
    });
  },

  /** Las tareas asignadas a esta persona. */
  findForRecipient(userId) {
    return prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { created_at: 'desc' },
      include: AUTOR,
    });
  },

  /**
   * ¿Hay algo posterior a la última vez que abrió las notificaciones?
   *
   * `desde` nulo significa que nunca las ha abierto: entonces cuenta cualquiera.
   */
  contarDesde({ userId, esAdmin, desde }) {
    return prisma.notification.count({
      where: {
        ...(esAdmin ? { module: { in: MODULOS_ADMIN } } : { recipientId: userId }),
        ...(desde ? { created_at: { gt: desde } } : {}),
      },
    });
  },

  seenAt(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { notificationsSeenAt: true },
    });
  },

  marcarVistas(userId, cuando) {
    return prisma.user.update({
      where: { id: userId },
      data: { notificationsSeenAt: cuando },
    });
  },

  create(data) {
    return prisma.notification.create({ data });
  },
};
