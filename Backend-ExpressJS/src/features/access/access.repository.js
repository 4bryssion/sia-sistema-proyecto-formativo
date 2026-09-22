import prisma from '../../config/prisma.js';
import { SUPERADMIN_GROUP } from '../../config/systemIdentities.js';

export const accessRepository = {
  // json_build_object replica la forma { group: { id, groupName } } que daba Prisma con include
  async getUserGroups(userId) {
    return prisma.$queryRaw`
      SELECT
        ug.user_id    AS "userId",
        ug.group_id   AS "groupId",
        ug.created_at AS "created_at",
        json_build_object('id', g.id, 'groupName', g.group_name) AS "group"
      FROM user_groups ug
      INNER JOIN groups g ON g.id = ug.group_id
      WHERE ug.user_id = ${userId};`;
  },

  // (p50) Estas cuatro pasaron de `$executeRaw` a llamadas de modelo de Prisma.
  // No es estilo: la auditoría automática es una extensión de Prisma y NO VE el
  // SQL crudo. Asignar y quitar grupos y permisos a una persona es de lo más
  // sensible que hace el sistema, y mientras fuera SQL crudo no dejaba huella.
  //
  // Las LECTURAS de este archivo se quedan en SQL crudo: no hay nada que
  // auditar en ellas y sus `json_build_object` arman la forma exacta que espera
  // el frontend, que con `include` de Prisma habría que rehacer.
  async assignGroup(userId, groupId) {
    await prisma.userGroup.create({ data: { userId, groupId } });
  },

  async removeGroup(userId, groupId) {
    await prisma.userGroup.delete({ where: { userId_groupId: { userId, groupId } } });
  },

  async hasGroup(userId, groupId) {
    const rows = await prisma.$queryRaw`
      SELECT 1 FROM user_groups
      WHERE user_id = ${userId} AND group_id = ${groupId}
      LIMIT 1;`;
    return rows.length > 0;
  },

  // json_build_object replica { permission: { id, permissionName } } — sin description (eliminado en P35)
  async getUserPermissions(userId) {
    return prisma.$queryRaw`
      SELECT
        up.user_id       AS "userId",
        up.permission_id AS "permissionId",
        up.created_at    AS "created_at",
        json_build_object('id', p.id, 'permissionName', p.permission_name) AS "permission"
      FROM user_permissions up
      INNER JOIN permissions p ON p.id = up.permission_id
      WHERE up.user_id = ${userId};`;
  },

  async assignPermission(userId, permissionId) {
    await prisma.userPermission.create({ data: { userId, permissionId } });
  },

  async removePermission(userId, permissionId) {
    await prisma.userPermission.delete({
      where: { userId_permissionId: { userId, permissionId } },
    });
  },

  async hasPermission(userId, permissionId) {
    const rows = await prisma.$queryRaw`
      SELECT 1 FROM user_permissions
      WHERE user_id = ${userId} AND permission_id = ${permissionId}
      LIMIT 1;`;
    return rows.length > 0;
  },

  // --- Métodos nuevos estilo edward ---

  async isSuperUser(userId) {
    const rows = await prisma.$queryRaw`
      SELECT 1
      FROM user_groups ug
      INNER JOIN groups g ON g.id = ug.group_id
      WHERE ug.user_id = ${userId}
        AND g.group_name = ${SUPERADMIN_GROUP}
        AND g.is_active = TRUE
      LIMIT 1;`;
    return rows.length > 0;
  },

  // Catálogo completo de codenames (usado para SuperAdmin: tiene acceso total)
  async getAllPermissionCodenames() {
    const rows = await prisma.$queryRaw`
      SELECT p.permission_codename AS "permissionCodename" FROM permissions p;`;
    return rows.map((r) => r.permissionCodename);
  },

  // Devuelve todos los codenames de permisos del usuario (directos + via grupos)
  async getUserPermissionCodenames(userId) {
    const rows = await prisma.$queryRaw`
      SELECT DISTINCT p.permission_codename AS "permissionCodename"
      FROM permissions p
      INNER JOIN user_permissions up ON up.permission_id = p.id
      WHERE up.user_id = ${userId}
      UNION
      SELECT DISTINCT p.permission_codename AS "permissionCodename"
      FROM permissions p
      INNER JOIN group_permissions gp ON gp.permission_id = p.id
      INNER JOIN user_groups ug       ON ug.group_id = gp.group_id
      WHERE ug.user_id = ${userId};`;
    return rows.map((r) => r.permissionCodename);
  },
};
