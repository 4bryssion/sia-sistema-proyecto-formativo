// Reglas de archivos del MATERIAL (los dos tipos).
//
// Vivía en features/returnable-material/utils/materialFiles.js. Con p48 el
// material de consumo también tiene hasta 3 imágenes y hasta 3 fichas técnicas
// —las fichas cuelgan ahora de la tabla PADRE—, así que las reglas las comparten
// los dos módulos y por la regla de módulos cruzados bajan a shared.
//
// Lo que NO bajó: `requiresDimensions` y `categoryNameOf`, que dependen de las
// categorías y solo existen en devolutivo. Quedaron en
// features/returnable-material/utils/categoryRules.js.

// (p48) Hasta 3 imágenes, filas en consumable_material_images con su sortOrder,
// exactamente igual que las fichas técnicas.
export const MAX_IMAGES = 3;

// (p48) Hasta 3 fichas técnicas en material_files, obligatorias (mínimo 1) en
// los DOS módulos.
export const MAX_TECHNICAL_SHEETS = 3;

// Mínimos que exige el backend. Se repiten aquí para poder avisar antes de
// enviar, no para sustituir su validación.
export const MIN_IMAGES = 1;
export const MIN_TECHNICAL_SHEETS = 1;

// Huecos dibujados en las tiras de previsualización: el espacio de los 3 queda
// reservado para que la caja no cambie de tamaño al ir agregando archivos.
export const FILE_SLOTS = 3;

// (p49) Huecos reservados en los FORMULARIOS (crear y editar material).
//
// Uno, no tres: en un paso de modal, reservar el hueco de tres
// previsualizaciones deja un vacío enorme mientras solo hay un archivo. Con uno
// reservado la caja ya no salta de tamaño al cargar el primero —que es el
// problema que `slots` resuelve— y los demás archivos se recorren con las
// flechas del propio FileInput.
//
// FILE_SLOTS sigue en 3 porque lo usa el panel de VISUALIZAR, donde las tres
// miniaturas se ven a la vez y no hay nada que reservar: ya están todas.
export const FORM_PREVIEW_SLOTS = 1;

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

// Base de los archivos servidos por el backend. Un solo sitio: estaba repetido
// como constante local en los cuatro modales de material.
export const API_FILES = "http://localhost:5000";

// Un archivo YA guardado, descrito como lo espera FileInput (que distingue File
// de descriptor remoto para no revocar una URL que no creó).
export const remoteSheet = (sheet) => ({
  id:   sheet.id,
  url:  `${API_FILES}${sheet.fileUrl}`,
  name: sheet.fileName,
  type: sheet.mimeType,
});

// (p48) La imagen dejó de ser una columna: es una fila con id, igual que la
// ficha. Por eso ahora también lleva id y puede reordenarse y eliminarse.
export const remoteImage = (image) => ({
  id:   image.id,
  url:  `${API_FILES}${image.imageUrl}`,
  name: image.fileName,
  type: image.mimeType,
});

export const isNewFile = (item) => item instanceof File;

/**
 * Orden final de una colección de archivos, tal como lo espera el backend:
 * mezcla los ids ya guardados con referencias "new:<i>" a los archivos que
 * viajan en ESTA petición. Lo que no aparezca en la lista se elimina.
 *
 * Devuelve { order, nuevos } — `nuevos` en el mismo orden en que se referencian,
 * que es el orden en que hay que hacer los append al FormData.
 */
export const buildFileOrder = (items) => {
  const nuevos = items.filter(isNewFile);
  const order = items.map((item) =>
    isNewFile(item) ? `new:${nuevos.indexOf(item)}` : item.id,
  );
  return { order, nuevos };
};
