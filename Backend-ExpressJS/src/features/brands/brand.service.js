import { brandRepository } from './brand.repository.js';

export const brandService = {
  async getAll() {
    return brandRepository.findAll();
  },
  async getById(id) {
    const item = await brandRepository.findById(id);
    if (!item) throw new Error('Marca no encontrada.');
    return item;
  },
  async create(data) {
    return brandRepository.create(data);
  },
  async update(id, data) {
    await brandService.getById(id);
    return brandRepository.update(id, data);
  },
  async delete(id) {
    await brandService.getById(id);
    return brandRepository.delete(id);
  },
};
