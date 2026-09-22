import prisma from '../../config/prisma.js';

export const auditRepository = {
  /**
   * Registros de auditoría dentro de un rango de fechas.
   *
   * El rango es OBLIGATORIO y lo impone el service: sin él, la primera descarga
   * de un sistema con meses de uso intentaría traer la tabla entera a memoria.
   */
  async findRange(desde, hasta, tope) {
    return prisma.auditLog.findMany({
      where: { created_at: { gte: desde, lte: hasta } },
      orderBy: { created_at: 'desc' },
      take: tope,
      include: {
        actor: { select: { id: true, userFirstName: true, userLastName: true, userEmail: true } },
      },
    });
  },

  async countRange(desde, hasta) {
    return prisma.auditLog.count({ where: { created_at: { gte: desde, lte: hasta } } });
  },
};
