import prisma from '../../config/prisma.js';

export const categoryRepository = {
  // (p50) isActiveFilter undefined = sin filtro (todas). Antes forzaba
  // isActive:true, así que una categoría desactivada desaparecía del listado y
  // ya no se podía reactivar — el mismo hueco que tenían marcas, grupos e
  // inventarios y que se corrigió en p48. Categorías se quedó fuera entonces
  // porque todavía no tenía pantalla propia.
  async findAll(isActiveFilter) {
    const where = {};
    if (isActiveFilter !== undefined) where.isActive = isActiveFilter;
    return prisma.category.findMany({
      where,
      orderBy: { categoryName: 'asc' },
    });
  },

  // Cuántos materiales devolutivos usan la categoría. Se consulta antes de
  // desactivarla para poder decirlo en el aviso: desactivarla no deja a esos
  // materiales sin categoría, pero sí la saca del select de crear.
  async countMaterials(id) {
    return prisma.returnableMaterial.count({ where: { categoryId: id } });
  },

  async findById(id) {
    return prisma.category.findUnique({ where: { id } });
  },

  // (p50) Busca por el nombre normalizado: es como se detecta que «Gucci» y
  // «Gúcci» son la misma cosa antes de intentar guardarlas.
  async findByNormalized(normalizado) {
    return prisma.category.findUnique({ where: { categoryNameNormalized: normalizado } });
  },

  async create(data) {
    return prisma.category.create({ data });
  },

  async update(id, data) {
    return prisma.category.update({ where: { id }, data });
  },

  async toggle(id, isActive) {
    return prisma.category.update({ where: { id }, data: { isActive } });
  },
};
