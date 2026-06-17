import { documentTypeRepository } from './documentType.repository.js';

export const documentTypeService = {
  async getAll() {
    return documentTypeRepository.findAll();
  },
  async getById(id) {
    const item = await documentTypeRepository.findById(id);
    if (!item) throw new Error('Tipo de documento no encontrado.');
    return item;
  },
  async create(data) {
    return documentTypeRepository.create(data);
  },
  async update(id, data) {
    await documentTypeService.getById(id);
    return documentTypeRepository.update(id, data);
  },
  async delete(id) {
    await documentTypeService.getById(id);
    return documentTypeRepository.delete(id);
  },
};
