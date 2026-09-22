import prisma from '../../config/prisma.js';

export const taskRepository = {
  // (p50) `isActiveFilter` undefined = sin filtrar (Todos). Mismo contrato que
  // el resto de los listados del sistema: el service lo traduce desde `status`.
  async findAll(isActiveFilter) {
    const where = {};
    if (isActiveFilter !== undefined) where.isActive = isActiveFilter;
    return prisma.task.findMany({
      where,
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

  // Vencimiento automático: tareas en progreso cuya fecha de fin ya pasó → no_completada
  async markOverdue() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return prisma.task.updateMany({
      where: {
        status: 'en_progreso',
        isActive: true,
        endDate: { lt: startOfToday },
      },
      data: { status: 'no_completada' },
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
