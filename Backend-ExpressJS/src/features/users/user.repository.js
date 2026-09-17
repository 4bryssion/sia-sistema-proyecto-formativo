import prisma from '../../config/prisma.js';
import { withoutSuperAdminUsers } from '../../config/systemIdentities.js';

const selectPublic = {
  id:                     true,
  userFirstName:          true,
  userLastName:           true,
  userDocumentNumber:     true,
  // (p48) Vigencia del vínculo. Ambas gobiernan el acceso, así que el frontend
  // las necesita para explicar por qué un usuario no puede entrar todavía.
  userStartDate:          true,
  userEndDate:            true,
  userEmail:              true,
  userEmailInstitutional: true,
  userPhone:              true,
  userSecondPhone:        true,
  userAddress:            true,
  isActive:               true,
  userPhoto:              true,
  userAccountType:        true,
  // (p48) Cuándo aceptó el tratamiento de datos personales (Ley 1581 de 2012).
  // Se expone para poder mostrarlo en "Mi perfil"; null = aceptación anterior a p48.
  dataPolicyAcceptedAt:   true,
  createdAt:              true,
  updatedAt:              true,
  documentType: { select: { id: true, documentName: true } },
  groups: {
    select: {
      group: {
        select: {
          id: true,
          groupName: true,
          _count: { select: { permissions: true } },
        },
      },
    },
  },
};

export const userRepository = {
  async findAll(status = 'active') {
    const statusWhere =
      status === 'all'      ? {} :
      status === 'inactive' ? { isActive: false } :
                              { isActive: true }; // 'active' y cualquier valor desconocido

    return prisma.user.findMany({
      // El SADMIN se excluye AQUÍ y no en cada pantalla: este listado alimenta
      // la tabla de usuarios, los reportes y todos los selects de cuentadante,
      // prestador, receptor y asignación de tareas. Filtrarlo en el origen evita
      // que un listado nuevo se olvide de hacerlo y lo deje ver.
      where: { ...statusWhere, ...withoutSuperAdminUsers },
      select: selectPublic,
      orderBy: { userFirstName: 'asc' },
    });
  },

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: selectPublic,
    });
  },

  async findByIdWithPassword(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data) {
    return prisma.user.create({
      data,
      select: selectPublic,
    });
  },

  async createWithGroup(data, groupId) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data });
      await tx.userGroup.create({ data: { userId: created.id, groupId } });
      return tx.user.findUnique({ where: { id: created.id }, select: selectPublic });
    });
  },

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: selectPublic,
    });
  },

  // (p48) `fechas` solo llega al REACTIVAR (fechas nuevas exigidas por el flujo) o
  // al desactivar antes de tiempo (la finalización se adelanta al día de hoy).
  // Va en el mismo update que isActive para que no pueda quedar un usuario activo
  // con fechas viejas si algo falla entre las dos escrituras.
  async toggle(id, isActive, fechas = {}) {
    return prisma.user.update({
      where: { id },
      data: { isActive, ...fechas },
      select: selectPublic,
    });
  },

  // (p48) Cuentas cuyo vínculo ya venció y siguen activas. Las busca la tarea
  // programada diaria. El SuperAdmin no se excluye aquí a propósito: si alguien
  // le pusiera una fecha vencida, debería desactivarse igual que cualquier otra.
  async findExpired(hoy) {
    return prisma.user.findMany({
      where: { isActive: true, userEndDate: { lt: hoy } },
      select: { id: true, userFirstName: true, userLastName: true, userEmail: true, userEndDate: true },
    });
  },

  async deactivateMany(ids) {
    return prisma.user.updateMany({
      where: { id: { in: ids } },
      // La sesión activa se libera también: si el usuario estaba dentro, su token
      // deja de servir en la siguiente petición (authenticateToken contrasta el jti)
      data: { isActive: false, activeSessionJti: null, activeSessionExpiresAt: null },
    });
  },

};
