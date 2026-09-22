import prisma from '../../config/prisma.js';

// Orden explícito por sortOrder en imágenes y fichas: el id refleja el orden de
// SUBIDA, no el que el usuario dejó al arrastrar las previsualizaciones.
//
// Los cuentadantes se ordenan por created_at para que "el primero" sea siempre el
// mismo: la interfaz muestra "<primero> y N más" y no puede cambiar entre recargas.
const includeRelations = {
  accountables: {
    orderBy: { created_at: 'asc' },
    include: {
      user: { select: { id: true, userFirstName: true, userLastName: true, userAccountType: true } },
    },
  },
  brand: { select: { id: true, brandName: true } },
  inventory: { select: { id: true, inventoryName: true } },
  images: { orderBy: { sortOrder: 'asc' } },
  technicalSheets: { orderBy: { sortOrder: 'asc' } },
  // (p50) Cotizaciones que respaldan el precio. Se ordenan por fecha de
  // asignación para que la lista no baile entre recargas.
  quotations: {
    orderBy: { created_at: 'asc' },
    include: { quotation: true },
  },
};

export const consumableMaterialRepository = {
  async findAll(isActiveFilter) {
    const where = { returnable: null };
    if (isActiveFilter !== undefined) where.isActive = isActiveFilter;
    return prisma.consumableMaterial.findMany({
      where,
      include: includeRelations,
      orderBy: { materialName: 'asc' },
    });
  },

  async findById(id) {
    return prisma.consumableMaterial.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  // Material, cuentadantes, imágenes y fichas nacen juntos: un create anidado los
  // deja en una sola transacción implícita, así que un fallo no deja el material
  // creado sin sus archivos.
  async create(data, accountableIds, images, sheets, quotationIds = []) {
    return prisma.consumableMaterial.create({
      data: {
        ...data,
        accountables: { create: accountableIds.map((userId) => ({ userId })) },
        images: { create: images },
        technicalSheets: { create: sheets },
        quotations: { create: quotationIds.map((quotationId) => ({ quotationId })) },
      },
      include: includeRelations,
    });
  },

  // Las operaciones sobre imágenes y fichas llegan ya resueltas por el service
  // (qué se borra, qué cambia de posición, qué se crea). Aquí solo se ejecutan.
  //
  // Todo en una transacción: a medias dejaría el material con archivos borrados y
  // los nuevos sin insertar.
  async update(id, data, accountableIds, imageOps = {}, sheetOps = {}, quotationIds) {
    const operaciones = [
      prisma.consumableMaterial.update({ where: { id }, data }),
    ];

    // accountableIds undefined = la edición no tocó los cuentadantes.
    // Se reemplaza el conjunto completo en vez de calcular altas y bajas: la
    // tabla no guarda nada más que el vínculo, así que no hay dato que perder.
    if (accountableIds !== undefined) {
      operaciones.push(prisma.materialAccountable.deleteMany({ where: { materialId: id } }));
      operaciones.push(
        prisma.materialAccountable.createMany({
          data: accountableIds.map((userId) => ({ materialId: id, userId })),
        }),
      );
    }

    // (p50) quotationIds undefined = la edición no tocó las cotizaciones.
    // Mismo criterio que con cuentadantes: se reemplaza el conjunto completo,
    // porque la tabla intermedia no guarda nada más que el vínculo.
    if (quotationIds !== undefined) {
      operaciones.push(prisma.materialQuotation.deleteMany({ where: { materialId: id } }));
      if (quotationIds.length) {
        operaciones.push(
          prisma.materialQuotation.createMany({
            data: quotationIds.map((quotationId) => ({ materialId: id, quotationId })),
          }),
        );
      }
    }

    const aplicar = (ops, delegate) => {
      const { deleteIds = [], reorder = [], create = [] } = ops;
      if (deleteIds.length) {
        operaciones.push(delegate.deleteMany({ where: { id: { in: deleteIds }, materialId: id } }));
      }
      reorder.forEach(({ id: filaId, sortOrder }) => {
        operaciones.push(delegate.update({ where: { id: filaId }, data: { sortOrder } }));
      });
      if (create.length) {
        operaciones.push(delegate.createMany({ data: create.map((f) => ({ ...f, materialId: id })) }));
      }
    };

    aplicar(imageOps, prisma.consumableMaterialImage);
    aplicar(sheetOps, prisma.materialFile);

    await prisma.$transaction(operaciones);

    // Relectura tras la transacción: el update del material devuelve el estado
    // ANTERIOR a tocar cuentadantes, imágenes y fichas
    return prisma.consumableMaterial.findUnique({ where: { id }, include: includeRelations });
  },

  async toggle(id, isActive) {
    return prisma.consumableMaterial.update({
      where: { id },
      data: { isActive },
      include: includeRelations,
    });
  },

  // Los cuentadantes deben ser usuarios activos con tipo de cuenta Cuentadante:
  // se comprueba antes de crear para dar un error legible en vez de una violación de FK
  async findValidAccountables(ids) {
    return prisma.user.findMany({
      where: { id: { in: ids }, isActive: true, userAccountType: 'Cuentadante' },
      select: { id: true },
    });
  },
};
