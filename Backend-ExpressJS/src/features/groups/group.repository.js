import prisma from '../../config/prisma.js';

export const groupRepository = {
  // json_agg replica la forma { permissions: [{ groupId, permissionId, permission:{id,permissionName} }], _count:{users,permissions} }
  // que entregaba Prisma con include. COALESCE+FILTER evita null cuando un grupo no tiene permisos.
  async findAll() {
    const rows = await prisma.$queryRaw`
      SELECT
        g.id          AS "id",
        g.group_name  AS "groupName",
        g.is_active   AS "isActive",
        g.created_at  AS "created_at",
        g.updated_at  AS "updated_at",
        COALESCE(
          json_agg(
            json_build_object(
              'groupId',      gp.group_id,
              'permissionId', gp.permission_id,
              'permission',   json_build_object('id', p.id, 'permissionName', p.permission_name)
            )
          ) FILTER (WHERE gp.group_id IS NOT NULL),
          '[]'::json
        )             AS "permissions",
        (SELECT COUNT(*)::int FROM user_groups ug2      WHERE ug2.group_id  = g.id) AS "countUsers",
        (SELECT COUNT(*)::int FROM group_permissions gp2 WHERE gp2.group_id = g.id) AS "countPermissions"
      FROM groups g
      LEFT JOIN group_permissions gp ON gp.group_id = g.id
      LEFT JOIN permissions p        ON p.id = gp.permission_id
      WHERE g.is_active = TRUE
      GROUP BY g.id, g.group_name, g.is_active, g.created_at, g.updated_at
      ORDER BY g.group_name;`;
    // Mapear columnas planas de conteo al objeto _count que espera el frontend
    return rows.map(({ countUsers, countPermissions, ...group }) => ({
      ...group,
      _count: { users: countUsers, permissions: countPermissions },
    }));
  },

  async findById(id) {
    const rows = await prisma.$queryRaw`
      SELECT
        g.id          AS "id",
        g.group_name  AS "groupName",
        g.is_active   AS "isActive",
        g.created_at  AS "created_at",
        g.updated_at  AS "updated_at",
        COALESCE(
          json_agg(
            json_build_object(
              'groupId',      gp.group_id,
              'permissionId', gp.permission_id,
              'permission',   json_build_object('id', p.id, 'permissionName', p.permission_name)
            )
          ) FILTER (WHERE gp.group_id IS NOT NULL),
          '[]'::json
        )             AS "permissions"
      FROM groups g
      LEFT JOIN group_permissions gp ON gp.group_id = g.id
      LEFT JOIN permissions p        ON p.id = gp.permission_id
      WHERE g.id = ${id}
      GROUP BY g.id, g.group_name, g.is_active, g.created_at, g.updated_at;`;
    return rows[0] ?? null;
  },

  async create(data) {
    const rows = await prisma.$queryRaw`
      INSERT INTO groups (group_name, is_active, created_at, updated_at)
      VALUES (${data.groupName}, TRUE, NOW(), NOW())
      RETURNING
        id         AS "id",
        group_name AS "groupName",
        is_active  AS "isActive",
        created_at AS "created_at",
        updated_at AS "updated_at";`;
    return rows[0];
  },

  async update(id, data) {
    const rows = await prisma.$queryRaw`
      UPDATE groups
      SET
        group_name = COALESCE(${data.groupName ?? null}::varchar(100), group_name),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id         AS "id",
        group_name AS "groupName",
        is_active  AS "isActive",
        created_at AS "created_at",
        updated_at AS "updated_at";`;
    return rows[0] ?? null;
  },

  async toggle(id, isActive) {
    const rows = await prisma.$queryRaw`
      UPDATE groups
      SET is_active = ${isActive}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id         AS "id",
        group_name AS "groupName",
        is_active  AS "isActive",
        created_at AS "created_at",
        updated_at AS "updated_at";`;
    return rows[0] ?? null;
  },

  async assignPermission(groupId, permissionId) {
    await prisma.$executeRaw`
      INSERT INTO group_permissions (group_id, permission_id)
      VALUES (${groupId}, ${permissionId});`;
  },

  async removePermission(groupId, permissionId) {
    await prisma.$executeRaw`
      DELETE FROM group_permissions
      WHERE group_id = ${groupId} AND permission_id = ${permissionId};`;
  },

  async hasPermission(groupId, permissionId) {
    const rows = await prisma.$queryRaw`
      SELECT 1 FROM group_permissions
      WHERE group_id = ${groupId} AND permission_id = ${permissionId}
      LIMIT 1;`;
    return rows.length > 0;
  },

  // Estilo edward: lista los permisos del grupo incluyendo codename
  async getPermissionsByGroupId(groupId) {
    return prisma.$queryRaw`
      SELECT
        p.id                  AS "id",
        p.permission_name     AS "permissionName",
        p.permission_codename AS "permissionCodename"
      FROM permissions p
      INNER JOIN group_permissions gp ON gp.permission_id = p.id
      WHERE gp.group_id = ${groupId};`;
  },

  // Reemplazo atómico del set de permisos: DELETE + INSERTs en una sola transacción
  async updatePermissions(groupId, permissionIds) {
    await prisma.$transaction([
      prisma.$executeRaw`DELETE FROM group_permissions WHERE group_id = ${groupId}`,
      ...permissionIds.map((pid) =>
        prisma.$executeRaw`INSERT INTO group_permissions (group_id, permission_id) VALUES (${groupId}, ${pid})`),
    ]);
  },
};
