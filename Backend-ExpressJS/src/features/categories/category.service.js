import { categoryRepository } from './category.repository.js';
import { prepararNombre } from '../../shared/catalogName.js';

export const categoryService = {
  // Mismo contrato de `status` que el resto: active (por defecto) | inactive | all
  async getAll(status) {
    const filter =
      status === 'inactive' ? false :
      status === 'all'      ? undefined :
      true;
    return categoryRepository.findAll(filter);
  },

  async getById(id) {
    const item = await categoryRepository.findById(id);
    if (!item) throw new Error('Categoría no encontrada.');
    return item;
  },

  async create(data) {
    const { limpio, normalizado } = await prepararNombre({
      valor: data.categoryName,
      buscar: categoryRepository.findByNormalized,
      mensajeVacio: () => 'El nombre de la categoría no puede quedar vacío.',
      mensajeChoque: (x) => `Ya existe una categoría registrada como «${x.categoryName}». Usa esa o escribe un nombre distinto.`,
    });
    return categoryRepository.create({ ...data, categoryName: limpio, categoryNameNormalized: normalizado });
  },

  async update(id, data) {
    await categoryService.getById(id);
    // El nombre no es obligatorio en el PUT: si no viene, no se toca ni se
    // recalcula su forma normalizada.
    if (data.categoryName === undefined) return categoryRepository.update(id, data);

    const { limpio, normalizado } = await prepararNombre({
      valor: data.categoryName,
      buscar: categoryRepository.findByNormalized,
      idActual: id,
      mensajeVacio: () => 'El nombre de la categoría no puede quedar vacío.',
      mensajeChoque: (x) => `Ya existe una categoría registrada como «${x.categoryName}». Usa esa o escribe un nombre distinto.`,
    });
    return categoryRepository.update(id, { ...data, categoryName: limpio, categoryNameNormalized: normalizado });
  },

  async toggle(id) {
    const record = await categoryService.getById(id);
    // Los materiales devolutivos asignados NO se tocan al desactivar: siguen
    // perteneciendo a esta categoría y el listado los sigue mostrando. Lo que
    // cambia es que deja de ofrecerse al crear o editar un material. Se devuelve
    // el conteo para que la interfaz pueda decirlo en el aviso.
    const materiales = await categoryRepository.countMaterials(id);
    const updated = await categoryRepository.toggle(id, !record.isActive);
    return { ...updated, materialesAsignados: materiales };
  },

  // (p50) Este módulo no notifica, como ya no notifica ninguno salvo préstamos,
  // devoluciones y tareas: lo que hace aquí cada quien queda en `audit_log`.
};
