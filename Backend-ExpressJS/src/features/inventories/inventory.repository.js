import prisma from '../../config/prisma.js';

export const inventoryRepository = {
  // isActiveFilter undefined = sin filtro (todos). Marcas no lo tenía y por eso
  // un inventario desactivado desaparecía del listado y ya no se podía reactivar.
  async findAll(isActiveFilter) {
    const where = {};
    if (isActiveFilter !== undefined) where.isActive = isActiveFilter;
    return prisma.inventory.findMany({
      where,
      orderBy: { inventoryName: 'asc' },
    });
  },

  async findById(id) {
    return prisma.inventory.findUnique({ where: { id } });
  },

  // (p50) Busca por el nombre normalizado: es como se detecta que «Gucci» y
  // «Gúcci» son la misma cosa antes de intentar guardarlas.
  async findByNormalized(normalizado) {
    return prisma.inventory.findUnique({ where: { inventoryNameNormalized: normalizado } });
  },

  async create(data) {
    return prisma.inventory.create({ data });
  },

  async update(id, data) {
    return prisma.inventory.update({ where: { id }, data });
  },

  async toggle(id, isActive) {
    return prisma.inventory.update({ where: { id }, data: { isActive } });
  },

  // Cuántos materiales cuelgan del inventario. Se consulta antes de desactivarlo
  // para poder decirlo en el aviso: desactivarlo no los deja sin inventario, pero
  // sí lo saca del select de crear.
  async countMaterials(id) {
    return prisma.consumableMaterial.count({ where: { inventoryId: id } });
  },
};
