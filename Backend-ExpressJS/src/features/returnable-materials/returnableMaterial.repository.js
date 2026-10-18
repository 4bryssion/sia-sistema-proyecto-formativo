import prisma from '../../config/prisma.js';

// (p48) Cuentadantes, imágenes y fichas técnicas viven ahora en la tabla PADRE
// (consumable_materials), así que se piden a través de consumableMaterial y no
// del devolutivo. Las fichas dejaron de colgar de returnable_materials.
const relacionesDelPadre = {
  accountables: {
    orderBy: { created_at: 'asc' },
    include: {
      user: { select: { id: true, userFirstName: true, userLastName: true, userAccountType: true } },
    },
  },
  brand: { select: { id: true, brandName: true } },
  inventory: { select: { id: true, inventoryName: true } },
  // (p53) Los dos niveles de clasificacion. Las dos salen de `categories`: el
  // tipo es una de las 3 marcadas `isMaterialType` y la categoria una de las que
  // crea el usuario. Cuelgan del PADRE, asi que sirven a los dos materiales.
  category:     { select: { id: true, categoryName: true, requiresDimensions: true, isMaterialType: true } },
  materialType: { select: { id: true, categoryName: true, requiresDimensions: true, isMaterialType: true } },
  // Orden explícito por sortOrder: el id refleja el orden de SUBIDA, no el que
  // el usuario dejó al arrastrar las previsualizaciones
  images: { orderBy: { sortOrder: 'asc' } },
  technicalSheets: { orderBy: { sortOrder: 'asc' } },
  // (p50) Cotizaciones: también cuelgan del PADRE, como cuentadantes, imágenes
  // y fichas. Una sola tabla intermedia sirve a los dos tipos de material.
  quotations: {
    orderBy: { created_at: 'asc' },
    include: { quotation: true },
  },
};

// (p53) `category` ya no se pide aquí: se fue a la tabla padre junto con el
// tipo de material, el modelo y el serial, así que llega dentro de
// `consumableMaterial`. Lo único que queda en la hija es `dimensions`.
const includeComplete = {
  consumableMaterial: { include: relacionesDelPadre },
};

// El create/update entran por consumableMaterial (tabla padre), así que la
// relación se anida al revés que en includeComplete
const includeDesdePadre = {
  ...relacionesDelPadre,
  // (p53) La hija solo tiene `dimensions`; ya no hay nada que incluir dentro.
  returnable: true,
};

export const returnableMaterialRepository = {
  async findAll(status = 'active') {
    const where = {};
    if (status === 'active')   where.consumableMaterial = { isActive: true };
    if (status === 'inactive') where.consumableMaterial = { isActive: false };
    return prisma.returnableMaterial.findMany({
      where,
      include: includeComplete,
      orderBy: { consumableMaterial: { materialName: 'asc' } },
    });
  },

  async findById(id) {
    return prisma.returnableMaterial.findUnique({
      where: { id },
      include: includeComplete,
    });
  },

  async create(consumableData, returnableData, accountableIds, images, sheets, quotationIds = []) {
    return prisma.consumableMaterial.create({
      data: {
        ...consumableData,
        accountables: { create: accountableIds.map((userId) => ({ userId })) },
        images: { create: images },
        technicalSheets: { create: sheets },
        quotations: { create: quotationIds.map((quotationId) => ({ quotationId })) },
        returnable: { create: returnableData },
      },
      include: includeDesdePadre,
    });
  },

  // Las operaciones sobre imágenes y fichas llegan ya resueltas por el service.
  // Todo va en una transacción: un fallo a medias dejaría el material con
  // archivos borrados y los nuevos sin insertar.
  async update(id, consumableData, returnableData, accountableIds, imageOps = {}, sheetOps = {}, quotationIds) {
    const operaciones = [
      prisma.consumableMaterial.update({
        where: { id },
        data: {
          ...consumableData,
          ...(Object.keys(returnableData).length > 0 && {
            returnable: { update: returnableData },
          }),
        },
      }),
    ];

    // accountableIds undefined = la edición no tocó los cuentadantes.
    // Se reemplaza el conjunto completo: la tabla no guarda nada más que el
    // vínculo, así que no hay dato que perder al recrearlo.
    if (accountableIds !== undefined) {
      operaciones.push(prisma.materialAccountable.deleteMany({ where: { materialId: id } }));
      operaciones.push(
        prisma.materialAccountable.createMany({
          data: accountableIds.map((userId) => ({ materialId: id, userId })),
        }),
      );
    }

    // (p50) quotationIds undefined = la edición no tocó las cotizaciones.
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

    // Relectura tras la transacción: el update del padre devuelve el estado
    // ANTERIOR a tocar cuentadantes, imágenes y fichas
    return prisma.consumableMaterial.findUnique({ where: { id }, include: includeDesdePadre });
  },

  async toggle(id, isActive) {
    await prisma.consumableMaterial.update({
      where: { id },
      data: { isActive },
    });
    return prisma.returnableMaterial.findUnique({
      where: { id },
      include: includeComplete,
    });
  },

  async findValidAccountables(ids) {
    return prisma.user.findMany({
      where: { id: { in: ids }, isActive: true, userAccountType: 'Cuentadante' },
      select: { id: true },
    });
  },
};
