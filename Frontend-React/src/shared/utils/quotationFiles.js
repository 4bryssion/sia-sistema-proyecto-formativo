// (p50) Reglas de archivo de las cotizaciones, en un solo sitio porque las
// comparten el módulo de cotizaciones y los dos de material.

/** Cuántos PDF admite UNA carga desde el módulo de cotizaciones. */
export const MAX_POR_CARGA = 6;

/**
 * Cuántos admite la carga rápida desde el formulario de un material.
 *
 * Es 3 y no 6 a propósito: ahí se está cargando para asignar en el acto, y un
 * material no puede tener más de 3. Ofrecer 6 invitaría a cargar archivos que
 * no se van a poder asignar.
 */
export const MAX_POR_CARGA_EN_MATERIAL = 3;

/** Cuántas cotizaciones puede tener un material. */
export const MIN_POR_MATERIAL = 1;
export const MAX_POR_MATERIAL = 3;

// Solo PDF. A diferencia de la ficha técnica no admite Excel: una cotización es
// un documento firmado o membretado, no una hoja de cálculo.
export const QUOTATION_ACCEPT = "application/pdf";

// Un solo hueco reservado de previsualización, igual que en los formularios de
// material: el resto se recorre con las flechas del propio FileInput.
export const QUOTATION_PREVIEW_SLOTS = 1;

/** Base de los archivos servidos por el backend. */
export const API_FILES = "http://localhost:5000";

/** URL absoluta de una cotización, para abrirla en una pestaña nueva. */
export const quotationUrl = (cotizacion) =>
  cotizacion?.fileUrl ? `${API_FILES}${cotizacion.fileUrl}` : null;

/**
 * Opciones del select a partir de las cotizaciones del backend.
 * Conservan la cotización entera para que el botón de ver pueda abrirla sin
 * tener que volver a buscarla por id.
 */
export const toQuotationOptions = (cotizaciones = []) =>
  cotizaciones.map((c) => ({
    value: String(c.id),
    label: c.fileName,
    quotation: c,
  }));

/** Ids (como texto, que es lo que maneja el Select) de las ya asignadas. */
export const assignedQuotationIds = (asignaciones = []) =>
  asignaciones.map((a) => String(a.quotationId ?? a.quotation?.id)).filter(Boolean);

/** Las cotizaciones en sí, a partir de las filas de la tabla intermedia. */
export const assignedQuotations = (asignaciones = []) =>
  asignaciones.map((a) => a.quotation).filter(Boolean);
