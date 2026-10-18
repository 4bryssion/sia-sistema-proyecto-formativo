import prisma from '../../config/prisma.js';

// (p51) Lo que toda consulta de tareas necesita: sus asignaciones con el nombre
// de cada encargado. El `orderBy` es por nombre para que el listado enseñe
// siempre los mismos encargados en el mismo orden —sin él, Postgres puede
// devolverlos en cualquier orden y la columna "parpadea" entre recargas.
const asignacionesCon = (filtroUsuario = undefined) => ({
  assignments: {
    ...(filtroUsuario !== undefined ? { where: { userId: filtroUsuario } } : {}),
    include: {
      user: { select: { id: true, userFirstName: true, userLastName: true } },
    },
    orderBy: [{ user: { userFirstName: 'asc' } }, { user: { userLastName: 'asc' } }],
  },
});

export const taskRepository = {
  // (p50) `isActiveFilter` undefined = sin filtrar (Todos). Mismo contrato que
  // el resto de los listados del sistema: el service lo traduce desde `status`.
  async findAll(isActiveFilter) {
    const where = {};
    if (isActiveFilter !== undefined) where.isActive = isActiveFilter;
    return prisma.task.findMany({
      where,
      include: asignacionesCon(),
      orderBy: { created_at: 'desc' },
    });
  },

  // (p51) Las tareas de una persona. Devuelve SOLO su asignación, no las de los
  // demás: quien no tiene `list_tasks` ve lo suyo y nada más, igual que en
  // préstamos. El recorte va en la consulta, no después de leer.
  async findByUser(userId) {
    return prisma.task.findMany({
      where: { isActive: true, assignments: { some: { userId } } },
      include: asignacionesCon(userId),
      orderBy: { created_at: 'desc' },
    });
  },

  async findById(id) {
    return prisma.task.findUnique({
      where: { id },
      include: asignacionesCon(),
    });
  },

  // `userIds` son los encargados. Uno solo es la asignación individual: no hay
  // dos caminos, solo uno que admite varias filas.
  async create({ userIds, ...task }) {
    return prisma.task.create({
      data: {
        ...task,
        assignments: { create: userIds.map((userId) => ({ userId })) },
      },
      include: asignacionesCon(),
    });
  },

  /**
   * (p51) Actualiza la tarea y, si vienen `userIds`, reconcilia sus encargados.
   *
   * Reconciliar y no reemplazar: a quien sigue en la lista NO se le toca, así
   * conserva su estado y su fecha. Borrar todas las asignaciones y volver a
   * crearlas pondría a todo el mundo en «en progreso» otra vez, y quien ya había
   * terminado vería su trabajo deshecho por un cambio de título.
   *
   * Va en una transacción porque son tres escrituras que describen UN cambio: si
   * fallara a la mitad, la tarea quedaría con encargados de antes y de después.
   */
  async update(id, { userIds, ...data }) {
    if (userIds === undefined) {
      return prisma.task.update({ where: { id }, data, include: asignacionesCon() });
    }

    const quedan = [...new Set(userIds.map(Number))];

    return prisma.$transaction(async (tx) => {
      const actuales = (await tx.taskAssignment.findMany({ where: { taskId: id } }))
        .map((a) => a.userId);
      const entran = quedan.filter((u) => !actuales.includes(u));
      const salen  = actuales.filter((u) => !quedan.includes(u));

      if (salen.length) {
        await tx.taskAssignment.deleteMany({ where: { taskId: id, userId: { in: salen } } });
      }
      if (entran.length) {
        await tx.taskAssignment.createMany({
          data: entran.map((userId) => ({ taskId: id, userId })),
        });
      }
      return tx.task.update({ where: { id }, data, include: asignacionesCon() });
    });
  },

  /** La asignación de una persona en una tarea, o null si no la tiene. */
  async findAssignment(taskId, userId) {
    return prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId } },
      include: { user: { select: { id: true, userFirstName: true, userLastName: true } } },
    });
  },

  async setAssignmentStatus(assignmentId, status) {
    return prisma.taskAssignment.update({
      where: { id: assignmentId },
      data: { status },
      include: { user: { select: { id: true, userFirstName: true, userLastName: true } } },
    });
  },

  // Vencimiento automático. (p51) Ahora por ASIGNACIÓN: si cinco personas tienen
  // la misma tarea y tres la completaron, solo las dos que no vencen.
  //
  // (p50) Se ejecuta antes de cada listado, así que se comprueba primero si hay
  // algo que cambiar: un updateMany de cero filas generaba un registro de
  // auditoría en cada carga de la pantalla.
  async markOverdue() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const where = {
      status: 'en_progreso',
      task: { isActive: true, endDate: { lt: startOfToday } },
    };
    const pendientes = await prisma.taskAssignment.count({ where });
    if (pendientes === 0) return { count: 0 };
    return prisma.taskAssignment.updateMany({ where, data: { status: 'no_completada' } });
  },

  async toggle(id, isActive) {
    return prisma.task.update({
      where: { id },
      data: { isActive },
      include: asignacionesCon(),
    });
  },
};
