import prisma from '../../config/prisma.js';

export const groupRepository = {
  async findAll() {
    return prisma.group.findMany({
      orderBy: { groupName: 'asc' },
      include: {
        permissions: {
          include: { permission: { select: { id: true, permissionName: true } } },
        },
      },
    });
  },

  async findById(id) {
    return prisma.group.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: { select: { id: true, permissionName: true, description: true } } },
        },
      },
    });
  },

  async create(data) {
    return prisma.group.create({ data });
  },

  async update(id, data) {
    return prisma.group.update({ where: { id }, data });
  },

  async delete(id) {
    return prisma.group.delete({ where: { id } });
  },

  async assignPermission(groupId, permissionId) {
    return prisma.groupPermission.create({ data: { groupId, permissionId } });
  },

  async removePermission(groupId, permissionId) {
    return prisma.groupPermission.delete({
      where: { groupId_permissionId: { groupId, permissionId } },
    });
  },

  async hasPermission(groupId, permissionId) {
    const exists = await prisma.groupPermission.findUnique({
      where: { groupId_permissionId: { groupId, permissionId } },
    });
    return !!exists;
  },
};
