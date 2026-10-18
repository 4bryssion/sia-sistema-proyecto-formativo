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
        p.is_restricted        AS "isRestricted",
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
        is_restricted       AS "isRestricted",
        content_type_id     AS "contentTypeId"
      FROM permissions
      WHERE id = ${id};`;
    return rows[0] ?? null;
  },

  // (p51) De SQL crudo a llamadas de modelo, por el mismo motivo que en grupos:
  // la auditoría no ve un `$queryRaw` con INSERT o UPDATE, y la lista de
  // columnas escrita a mano se queda corta en cuanto el esquema crece.
  /**
   * (p51) Cuáles de estos ids son permisos de administración y seguridad.
   *
   * Devuelve las filas y no un booleano porque el mensaje de error tiene que
   * nombrarlos: "no puedes" sin decir qué no se puede obliga a adivinar.
   */
  async findRestricted(ids = []) {
    const limpios = ids.map(Number).filter(Number.isInteger);
    if (!limpios.length) return [];
    return prisma.permission.findMany({
      where: { id: { in: limpios }, isRestricted: true },
      select: { id: true, permissionName: true, permissionCodename: true },
    });
  },

  async create(data) {
    return prisma.permission.create({ data });
  },

  // Un campo ausente llega como undefined y Prisma lo deja como está: mismo
  // efecto que el COALESCE anterior. De paso desaparece su limitación — ahora
  // `contentTypeId: null` sí puede dejarlo vacío a propósito.
  async update(id, data) {
    return prisma.permission.update({ where: { id }, data });
  },

  async toggle(id, isActive) {
    return prisma.permission.update({ where: { id }, data: { isActive } });
  },
};
