import prisma from '../../config/prisma.js';

export const permissionRepository = {
  // SQL puro con JOIN a content_type para incluir appLabel/displayName/model en la respuesta.
  // No filtra por isActive (replica el query de edward que devuelve todos con isActive en la respuesta).
  async findAll() {
    return prisma.$queryRaw`
      SELECT
        p.id                   AS "id",
        p.permission_name      AS "permissionName",
        p.permission_codename  AS "permissionCodename",
        p.is_active            AS "isActive",
        ct.content_type_id     AS "contentTypeId",
        ct.app_label           AS "appLabel",
        ct.model               AS "model",
        ct.display_name        AS "displayName"
      FROM permissions p
      INNER JOIN content_type ct ON ct.content_type_id = p.content_type_id
      ORDER BY ct.display_name, p.permission_name;`;
  },

  async findById(id) {
    const rows = await prisma.$queryRaw`
      SELECT
        id                  AS "id",
        permission_name     AS "permissionName",
        permission_codename AS "permissionCodename",
        is_active           AS "isActive",
        content_type_id     AS "contentTypeId"
      FROM permissions
      WHERE id = ${id};`;
    return rows[0] ?? null;
  },

  async create(data) {
    const rows = await prisma.$queryRaw`
      INSERT INTO permissions (permission_name, permission_codename, content_type_id, is_active, created_at, updated_at)
      VALUES (${data.permissionName}, ${data.permissionCodename}, ${data.contentTypeId ?? null}, TRUE, NOW(), NOW())
      RETURNING
        id                  AS "id",
        permission_name     AS "permissionName",
        permission_codename AS "permissionCodename",
        is_active           AS "isActive",
        content_type_id     AS "contentTypeId",
        created_at,
        updated_at;`;
    return rows[0];
  },

  async update(id, data) {
    // COALESCE mantiene el valor actual si el campo llega undefined → null;
    // limitación conocida: no puede poner contentTypeId en null explícitamente (caso no requerido).
    const rows = await prisma.$queryRaw`
      UPDATE permissions
      SET
        permission_name     = COALESCE(${data.permissionName ?? null}::varchar(150), permission_name),
        permission_codename = COALESCE(${data.permissionCodename ?? null}::varchar(100), permission_codename),
        content_type_id     = COALESCE(${data.contentTypeId ?? null}::integer, content_type_id),
        updated_at          = NOW()
      WHERE id = ${id}
      RETURNING
        id                  AS "id",
        permission_name     AS "permissionName",
        permission_codename AS "permissionCodename",
        is_active           AS "isActive",
        content_type_id     AS "contentTypeId",
        created_at,
        updated_at;`;
    return rows[0] ?? null;
  },

  async toggle(id, isActive) {
    const rows = await prisma.$queryRaw`
      UPDATE permissions
      SET is_active = ${isActive}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id                  AS "id",
        permission_name     AS "permissionName",
        permission_codename AS "permissionCodename",
        is_active           AS "isActive",
        content_type_id     AS "contentTypeId",
        created_at,
        updated_at;`;
    return rows[0] ?? null;
  },
};
