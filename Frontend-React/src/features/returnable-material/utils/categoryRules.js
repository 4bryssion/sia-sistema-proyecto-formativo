// Reglas de categoría del material devolutivo. Antes vivían en
// utils/materialFiles.js junto a las reglas de archivos; esas bajaron a
// shared/utils/materialFiles.js al pasar a compartirse con el material de
// consumo (p48) y estas se quedaron aquí, porque las categorías solo existen
// en devolutivo.

// Única categoría que pide dimensiones. Se compara por nombre normalizado
// (sin tildes ni mayúsculas) para que no dependa de cómo esté escrita en la BD.
const CATEGORY_WITH_DIMENSIONS = "muebles y enseres";

const normalizar = (texto = "") =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

/**
 * ¿La categoría seleccionada pide el campo de dimensiones?
 * Para el resto la columna queda NULL y no interviene en la creación.
 */
export const requiresDimensions = (categoryName) =>
  normalizar(categoryName) === CATEGORY_WITH_DIMENSIONS;

/** Nombre de categoría a partir del id seleccionado en el select */
export const categoryNameOf = (options, categoryId) =>
  options.find((o) => String(o.value) === String(categoryId))?.label ?? "";
