import prisma from '../../config/prisma.js';

// (p53) Ajustes del sistema en clave/valor. La tabla es genérica; el significado
// de cada clave lo pone el service, que es quien sabe que `support_email` tiene
// que ser un correo.
export const settingRepository = {
  async findByKey(settingKey) {
    return prisma.systemSetting.findUnique({ where: { settingKey } });
  },

  // `upsert` y no `update`: si la migración no alcanzó a insertar la fila —una
  // base levantada solo con `migrate deploy` sobre un esquema viejo—, el primer
  // guardado la crea en vez de fallar con "registro no encontrado".
  async upsertByKey(settingKey, settingValue, updatedById) {
    return prisma.systemSetting.upsert({
      where: { settingKey },
      update: { settingValue, updatedById },
      create: { settingKey, settingValue, updatedById },
    });
  },
};
