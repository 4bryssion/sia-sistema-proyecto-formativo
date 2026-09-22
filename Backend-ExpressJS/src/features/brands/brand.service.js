import { brandRepository } from './brand.repository.js';
import { prepararNombre } from '../../shared/catalogName.js';
export const brandService = {
  // Mismo contrato de `status` que materiales e inventarios:
  // active (por defecto) | inactive | all
  async getAll(status) {
    const filter =
      status === 'inactive' ? false :
      status === 'all'      ? undefined :
      true;
    return brandRepository.findAll(filter);
  },

  async getById(id) {
    const item = await brandRepository.findById(id);
    if (!item) throw new Error('Marca no encontrada.');
    return item;
  },

  async create(data) {
    const { limpio, normalizado } = await prepararNombre({
      valor: data.brandName,
      buscar: brandRepository.findByNormalized,
      mensajeVacio: () => 'El nombre de la marca no puede quedar vacío.',
      mensajeChoque: (x) => `Ya existe una marca registrada como «${x.brandName}». Usa esa o escribe un nombre distinto.`,
    });
    return brandRepository.create({ ...data, brandName: limpio, brandNameNormalized: normalizado });
  },

  async update(id, data) {
    await brandService.getById(id);
    // El nombre no es obligatorio en el PUT: si no viene, no se toca ni se
    // recalcula su forma normalizada.
    if (data.brandName === undefined) return brandRepository.update(id, data);

    const { limpio, normalizado } = await prepararNombre({
      valor: data.brandName,
      buscar: brandRepository.findByNormalized,
      idActual: id,
      mensajeVacio: () => 'El nombre de la marca no puede quedar vacío.',
      mensajeChoque: (x) => `Ya existe una marca registrada como «${x.brandName}». Usa esa o escribe un nombre distinto.`,
    });
    return brandRepository.update(id, { ...data, brandName: limpio, brandNameNormalized: normalizado });
  },

  async toggle(id) {
    const record = await brandService.getById(id);
    const updated = await brandRepository.toggle(id, !record.isActive);
    return updated;
  },
};
