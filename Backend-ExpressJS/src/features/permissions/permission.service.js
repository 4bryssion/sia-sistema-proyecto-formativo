import { permissionRepository } from './permission.repository.js';

export const permissionService = {
  async getAll() {
    return permissionRepository.findAll();
  },

  async getById(id) {
    const permiso = await permissionRepository.findById(id);
    if (!permiso) throw new Error('Permiso no encontrado.');
    return permiso;
  },

  async create(data) {
    return permissionRepository.create(data);
  },

  async update(id, data) {
    await permissionService.getById(id);
    return permissionRepository.update(id, data);
  },

  async delete(id) {
    await permissionService.getById(id);
    return permissionRepository.delete(id);
  },
};
