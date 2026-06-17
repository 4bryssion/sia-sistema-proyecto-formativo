import { categoryRepository } from './category.repository.js';

export const categoryService = {
  async getAll() {
    return categoryRepository.findAll();
  },

  async getById(id) {
    const item = await categoryRepository.findById(id);
    if (!item) throw new Error('Categoría no encontrada.');
    return item;
  },

  async create(data) {
    return categoryRepository.create(data);
  },

  async update(id, data) {
    await categoryService.getById(id);
    return categoryRepository.update(id, data);
  },

  async toggle(id) {
    const record = await categoryService.getById(id);
    return categoryRepository.toggle(id, !record.isActive);
  },
};
