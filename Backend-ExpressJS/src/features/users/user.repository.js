import prisma from '../../config/prisma.js';
import { withoutSuperAdminUsers } from '../../config/systemIdentities.js';

const selectPublic = {
  id:                     true,
  userFirstName:          true,
  userLastName:           true,
  userDocumentNumber:     true,
  userEndDate:            true,
  userEmail:              true,
  userEmailInstitutional: true,
  userPhone:              true,
  userSecondPhone:        true,
  userAddress:            true,
  isActive:               true,
  userPhoto:              true,
  userAccountType:        true,
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

  async toggle(id, isActive) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
      select: selectPublic,
    });
  },
};
