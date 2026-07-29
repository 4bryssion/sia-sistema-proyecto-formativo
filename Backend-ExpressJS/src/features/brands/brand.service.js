import { brandRepository } from './brand.repository.js';
import { notify } from '../notifications/notification.service.js';

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
    const created = await brandRepository.create(data);
    notify({ title: 'Marca creada', description: `Se creó la marca "${created.brandName}".`, module: 'brands' });
    return created;
  },

  async update(id, data) {
    await brandService.getById(id);
    const updated = await brandRepository.update(id, data);
    notify({ title: 'Marca modificada', description: `Se actualizó la marca "${updated.brandName}".`, module: 'brands' });
    return updated;
  },

  async toggle(id) {
    const record = await brandService.getById(id);
    const updated = await brandRepository.toggle(id, !record.isActive);
    notify({
      title: updated.isActive ? 'Marca activada' : 'Marca desactivada',
      description: `"${updated.brandName}" quedó ${updated.isActive ? 'activa' : 'inactiva'}.`,
      severity: updated.isActive ? 'Informativa' : 'Advertencia',
      module: 'brands',
    });
    return updated;
  },
};
