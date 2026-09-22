import { inventoryRepository } from './inventory.repository.js';
import { prepararNombre } from '../../shared/catalogName.js';
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
    const { limpio, normalizado } = await prepararNombre({
      valor: data.inventoryName,
      buscar: inventoryRepository.findByNormalized,
      mensajeVacio: () => 'El nombre del inventario no puede quedar vacío.',
      mensajeChoque: (x) => `Ya existe un inventario registrado como «${x.inventoryName}». Usa ese o escribe un nombre distinto.`,
    });
    return inventoryRepository.create({ ...data, inventoryName: limpio, inventoryNameNormalized: normalizado });
  },

  async update(id, data) {
    await inventoryService.getById(id);
    // El nombre no es obligatorio en el PUT: si no viene, no se toca ni se
    // recalcula su forma normalizada.
    if (data.inventoryName === undefined) return inventoryRepository.update(id, data);

    const { limpio, normalizado } = await prepararNombre({
      valor: data.inventoryName,
      buscar: inventoryRepository.findByNormalized,
      idActual: id,
      mensajeVacio: () => 'El nombre del inventario no puede quedar vacío.',
      mensajeChoque: (x) => `Ya existe un inventario registrado como «${x.inventoryName}». Usa ese o escribe un nombre distinto.`,
    });
    return inventoryRepository.update(id, { ...data, inventoryName: limpio, inventoryNameNormalized: normalizado });
  },

  async toggle(id) {
    const record = await inventoryService.getById(id);
    // Los materiales asignados NO se tocan al desactivar: siguen perteneciendo a
    // este inventario y el listado los sigue mostrando. Lo que cambia es que deja
    // de ofrecerse al crear o editar un material.
    const materiales = await inventoryRepository.countMaterials(id);
    const updated = await inventoryRepository.toggle(id, !record.isActive);
    return updated;
  },
};
