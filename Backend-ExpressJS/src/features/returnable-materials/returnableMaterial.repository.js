import prisma from '../../config/prisma.js';

const includeComplete = {
  consumableMaterial: {
    include: {
      user: { select: { id: true, userFirstName: true, userLastName: true, userAccountType: true } },
      brand: { select: { id: true, brandName: true } },
    },
  },
  category: { select: { id: true, categoryName: true } },
  // Orden explícito por sortOrder: el id refleja el orden de SUBIDA, no el que
  // el usuario dejó al arrastrar las previsualizaciones
  technicalSheets: { orderBy: { sortOrder: 'asc' } },
};

// El create/update entran por consumableMaterial (tabla padre), así que la
// relación se anida al revés que en includeComplete
const includeDesdePadre = {
  returnable: {
    include: {
      category: true,
      technicalSheets: { orderBy: { sortOrder: 'asc' } },
    },
  },
  user: { select: { id: true, userFirstName: true, userLastName: true } },
  brand: true,
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

  async create(consumableData, returnableData, sheets = []) {
    return prisma.consumableMaterial.create({
      data: {
        ...consumableData,
        returnable: {
          create: {
            ...returnableData,
            technicalSheets: { create: sheets },
          },
        },
      },
      include: includeDesdePadre,
    });
  },

  // sheetOps llega ya resuelto por el service: qué filas se borran, cuáles
  // cambian de posición y cuáles se crean. Aquí solo se ejecutan.
  //
  // Todo va en una transacción porque un fallo a medias dejaría el material con
  // fichas borradas y las nuevas sin insertar.
  async update(id, consumableData, returnableData, sheetOps = {}) {
    const { deleteIds = [], reorder = [], create = [] } = sheetOps;

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

    if (deleteIds.length) {
      operaciones.push(
        prisma.returnableMaterialFile.deleteMany({
          where: { id: { in: deleteIds }, materialId: id },
        }),
      );
    }

    reorder.forEach(({ id: fileId, sortOrder }) => {
      operaciones.push(
        prisma.returnableMaterialFile.update({
          where: { id: fileId },
          data: { sortOrder },
        }),
      );
    });

    if (create.length) {
      operaciones.push(
        prisma.returnableMaterialFile.createMany({
          data: create.map((f) => ({ ...f, materialId: id })),
        }),
      );
    }

    await prisma.$transaction(operaciones);

    // Relectura tras la transacción: el update del padre devuelve el estado
    // ANTERIOR a tocar las fichas
    return prisma.consumableMaterial.findUnique({
      where: { id },
      include: includeDesdePadre,
    });
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
};
