import prisma from '../../config/prisma.js';

export const accessRepository = {
  async getUserGroups(userId) {
    return prisma.userGroup.findMany({
      where: { userId },
      include: { group: { select: { id: true, groupName: true } } },
    });
  },

  async assignGroup(userId, groupId) {
    return prisma.userGroup.create({ data: { userId, groupId } });
  },

  async removeGroup(userId, groupId) {
    return prisma.userGroup.delete({
      where: { userId_groupId: { userId, groupId } },
    });
  },

  async hasGroup(userId, groupId) {
    const resultado = await prisma.userGroup.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    return !!resultado;
  },

  async getUserPermissions(userId) {
    return prisma.userPermission.findMany({
      where: { userId },
      include: { permission: { select: { id: true, permissionName: true, description: true } } },
    });
  },

  async assignPermission(userId, permissionId) {
    return prisma.userPermission.create({ data: { userId, permissionId } });
  },

  async removePermission(userId, permissionId) {
    return prisma.userPermission.delete({
      where: { userId_permissionId: { userId, permissionId } },
    });
  },

  async hasPermission(userId, permissionId) {
    const resultado = await prisma.userPermission.findUnique({
      where: { userId_permissionId: { userId, permissionId } },
    });
    return !!resultado;
  },
};
