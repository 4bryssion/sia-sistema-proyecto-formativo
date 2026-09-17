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
  // Orden explícito por sortOrder: el id refleja el orden de SUBIDA, no el que
  // el usuario dejó al arrastrar las previsualizaciones
  images: { orderBy: { sortOrder: 'asc' } },
  technicalSheets: { orderBy: { sortOrder: 'asc' } },
};

const includeComplete = {
  consumableMaterial: { include: relacionesDelPadre },
  category: { select: { id: true, categoryName: true } },
};

// El create/update entran por consumableMaterial (tabla padre), así que la
// relación se anida al revés que en includeComplete
const includeDesdePadre = {
  ...relacionesDelPadre,
  returnable: { include: { category: true } },
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

  async create(consumableData, returnableData, accountableIds, images, sheets) {
    return prisma.consumableMaterial.create({
      data: {
        ...consumableData,
        accountables: { create: accountableIds.map((userId) => ({ userId })) },
        images: { create: images },
        technicalSheets: { create: sheets },
        returnable: { create: returnableData },
      },
      include: includeDesdePadre,
    });
  },

  // Las operaciones sobre imágenes y fichas llegan ya resueltas por el service.
  // Todo va en una transacción: un fallo a medias dejaría el material con
  // archivos borrados y los nuevos sin insertar.
  async update(id, consumableData, returnableData, accountableIds, imageOps = {}, sheetOps = {}) {
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
