import prisma from '../../config/prisma.js';

export const brandRepository = {
  // isActiveFilter undefined = sin filtro (todas). Antes estaba fijo en
  // `isActive: true`, así que una marca desactivada desaparecía del listado y
  // el interruptor de reactivarla no tenía forma de mostrarse (p48).
  async findAll(isActiveFilter) {
    const where = {};
    if (isActiveFilter !== undefined) where.isActive = isActiveFilter;
    return prisma.brand.findMany({
      where,
      orderBy: { brandName: 'asc' },
    });
  },

  async findById(id) {
    return prisma.brand.findUnique({ where: { id } });
  },

  // (p50) Busca por el nombre normalizado: es como se detecta que «Gucci» y
  // «Gúcci» son la misma cosa antes de intentar guardarlas.
  async findByNormalized(normalizado) {
    return prisma.brand.findUnique({ where: { brandNameNormalized: normalizado } });
  },

  async create(data) {
    return prisma.brand.create({ data });
  },

  async update(id, data) {
    return prisma.brand.update({ where: { id }, data });
  },

  async toggle(id, isActive) {
    return prisma.brand.update({ where: { id }, data: { isActive } });
  },
};
