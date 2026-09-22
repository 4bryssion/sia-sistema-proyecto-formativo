import prisma from '../../config/prisma.js';
import { SUPERADMIN_GROUP } from '../../config/systemIdentities.js';

export const groupRepository = {
  // json_agg replica la forma { permissions: [{ groupId, permissionId, permission:{id,permissionName} }], _count:{users,permissions} }
  // que entregaba Prisma con include. COALESCE+FILTER evita null cuando un grupo no tiene permisos.
  // isActiveFilter: true | false | undefined (undefined = sin filtro, todos).
  // Igual que marcas e inventarios: el listado de grupos es la pantalla donde se
  // administran, así que necesita ver también los inactivos para reactivarlos.
  // El default del service sigue siendo `active`, que es lo que esperan el panel
  // de accesos y el select de grupo de crear usuario.
  async findAll(isActiveFilter) {
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
      -- El grupo de superusuario se excluye en el origen: este listado alimenta
      -- la tabla de grupos, el panel de accesos y el select de grupo de crear
      -- usuario. Filtrarlo aquí evita repetir el filtro en cada pantalla.
      WHERE (${isActiveFilter ?? null}::boolean IS NULL
             OR g.is_active = ${isActiveFilter ?? null}::boolean)
        AND g.group_name <> ${SUPERADMIN_GROUP}
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

  // (p50) Busca por el nombre normalizado: es como se detecta que «Gucci» y
  // «Gúcci» son la misma cosa antes de intentar guardarlas.
  async findByNormalized(normalizado) {
    return prisma.group.findUnique({ where: { groupNameNormalized: normalizado } });
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

  // (p50) De SQL crudo a llamadas de modelo, por el mismo motivo que
  // updatePermissions: la extensión de auditoría no ve `$executeRaw`.
  async assignPermission(groupId, permissionId) {
    await prisma.groupPermission.create({ data: { groupId, permissionId } });
  },

  async removePermission(groupId, permissionId) {
    await prisma.groupPermission.delete({
      where: { groupId_permissionId: { groupId, permissionId } },
    });
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

  // Reemplazo atómico del set de permisos: borrar + insertar en una transacción.
  //
  // (p50) Pasó de `$executeRaw` a llamadas de modelo de Prisma. El motivo no es
  // estilo: la auditoría automática es una extensión de Prisma, y una extensión
  // NO VE el SQL crudo. Mientras esto fuera `$executeRaw`, cambiar qué puede
  // hacer cada grupo —la operación más sensible del sistema— seguiría sin dejar
  // ninguna huella, que es precisamente el hueco que la auditoría venía a cerrar.
  //
  // El comportamiento es idéntico: mismo borrado total y mismas inserciones,
  // dentro de la misma transacción.
  async updatePermissions(groupId, permissionIds) {
    await prisma.$transaction([
      prisma.groupPermission.deleteMany({ where: { groupId } }),
      prisma.groupPermission.createMany({
        data: permissionIds.map((permissionId) => ({ groupId, permissionId })),
      }),
    ]);
  },
};
