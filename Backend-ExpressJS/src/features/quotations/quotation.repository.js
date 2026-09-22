import prisma from '../../config/prisma.js';

export const quotationRepository = {
  // isActiveFilter undefined = sin filtro (todas). Mismo contrato que el resto
  // de catálogos: una cotización deshabilitada tiene que seguir siendo visible
  // para poder volver a habilitarla.
  async findAll(isActiveFilter) {
    const where = {};
    if (isActiveFilter !== undefined) where.isActive = isActiveFilter;
    return prisma.quotation.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        uploader: { select: { id: true, userFirstName: true, userLastName: true } },
        // Cuántos materiales respalda. Se muestra en el listado y se consulta
        // antes de deshabilitarla.
        _count: { select: { materials: true } },
      },
    });
  },

  async findById(id) {
    return prisma.quotation.findUnique({ where: { id } });
  },

  /**
   * (p50) Cotizaciones cuyo CONTENIDO coincide con alguna de estas huellas.
   *
   * Solo entran las que tienen huella: las cargadas antes de la migración valen
   * NULL hasta que se ejecute `npm run hashear-cotizaciones`, y hasta entonces
   * no participan en la detección. Se prefiere eso a inventarles una.
   */
  async findByHashes(hashes) {
    if (!hashes.length) return [];
    return prisma.quotation.findMany({
      where: { fileHash: { in: hashes } },
      select: { id: true, fileName: true, fileUrl: true, fileHash: true, isActive: true, created_at: true },
      // La más antigua primero: si por lo que sea hay varias con la misma
      // huella, la que se ofrece reutilizar es la original.
      orderBy: { created_at: 'asc' },
    });
  },

  // Una carga produce VARIAS cotizaciones: cada PDF es una. createMany no
  // devuelve las filas creadas, y el formulario de material necesita sus ids
  // para autoseleccionarlas, así que se crean una por una dentro de una
  // transacción: o entran todas o no entra ninguna.
  async createMany(registros) {
    return prisma.$transaction(
      registros.map((data) => prisma.quotation.create({ data })),
    );
  },

  async toggle(id, isActive) {
    return prisma.quotation.update({ where: { id }, data: { isActive } });
  },

  async countMaterials(id) {
    return prisma.materialQuotation.count({ where: { quotationId: id } });
  },

  // ---- Asignación material ↔ cotización -----------------------------------

  /** Ids de las cotizaciones asignadas a un material. */
  async idsDeMaterial(materialId) {
    const filas = await prisma.materialQuotation.findMany({
      where: { materialId },
      select: { quotationId: true },
    });
    return filas.map((f) => f.quotationId);
  },

  /** Cuántas de esas cotizaciones existen y están habilitadas. */
  async contarHabilitadas(ids) {
    if (!ids.length) return 0;
    return prisma.quotation.count({ where: { id: { in: ids }, isActive: true } });
  },

  // La sustitución de asignaciones NO vive aquí sino en los repositorios de
  // material: los suyos arman un ARRAY de operaciones para `$transaction`, no
  // una transacción interactiva, así que las operaciones tienen que nacer
  // dentro de ese array para compartir la misma transacción que el material.
};
