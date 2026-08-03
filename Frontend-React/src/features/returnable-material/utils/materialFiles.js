// Reglas de archivos y de categoría del material devolutivo, en un solo sitio
// porque las comparten el formulario de crear y los dos modales.

// Imagen: hoy es UNA. La columna `image` vive en el material de consumo (tabla
// padre de ambos tipos), así que subir a 3 exige tocar también ese módulo.
// El formulario ya está escrito contra esta constante: cuando la BD lo soporte,
// cambiar el 1 por 3 basta para que el file input acepte y navegue entre varias.
export const MAX_IMAGES = 1;

// Fichas técnicas: hasta 3 filas en returnable_material_files (p46)
export const MAX_TECHNICAL_SHEETS = 3;

// La ficha técnica es documentación, no fotografía: no acepta imágenes.
// Debe coincidir con ALLOWED_BY_FIELD.technical_sheet del backend
// (middleware/multerConfig.js), que es quien realmente rechaza el archivo.
export const TECHNICAL_SHEET_ACCEPT = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pdf",
  ".xls",
  ".xlsx",
].join(",");

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/jpg";

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
