import { inventoryRepository } from './inventory.repository.js';
import { notify } from '../notifications/notification.service.js';

export const inventoryService = {
  // Mismo contrato de `status` que materiales: active (por defecto) | inactive | all
  async getAll(status) {
    const filter =
      status === 'inactive' ? false :
      status === 'all'      ? undefined :
      true;
    return inventoryRepository.findAll(filter);
  },

  async getById(id) {
    const item = await inventoryRepository.findById(id);
    if (!item) throw new Error('Inventario no encontrado.');
    return item;
  },

  async create(data) {
    const created = await inventoryRepository.create(data);
    notify({
      title: 'Inventario creado',
      description: `Se creó el inventario "${created.inventoryName}".`,
      module: 'inventories',
    });
    return created;
  },

  async update(id, data) {
    await inventoryService.getById(id);
    const updated = await inventoryRepository.update(id, data);
    notify({
      title: 'Inventario modificado',
      description: `Se actualizó el inventario "${updated.inventoryName}".`,
      module: 'inventories',
    });
    return updated;
  },

  async toggle(id) {
    const record = await inventoryService.getById(id);
    // Los materiales asignados NO se tocan al desactivar: siguen perteneciendo a
    // este inventario y el listado los sigue mostrando. Lo que cambia es que deja
    // de ofrecerse al crear o editar un material.
    const materiales = await inventoryRepository.countMaterials(id);
    const updated = await inventoryRepository.toggle(id, !record.isActive);
    notify({
      title: updated.isActive ? 'Inventario activado' : 'Inventario desactivado',
      description:
        `"${updated.inventoryName}" quedó ${updated.isActive ? 'activo' : 'inactivo'}` +
        (!updated.isActive && materiales > 0
          ? `. Conserva ${materiales} material(es) asignado(s).`
          : '.'),
      severity: updated.isActive ? 'Informativa' : 'Advertencia',
      module: 'inventories',
    });
    return updated;
  },
};
