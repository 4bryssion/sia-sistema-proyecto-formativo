// Formatos de fecha del proyecto.
//
// El formato de auditoría (HH:MM, DD/MM/AAAA) está fijado por las convenciones
// globales del documento de requerimientos: todo cambio se registra así. Vivía
// solo dentro del módulo de notificaciones; se sube a shared porque ahora también
// lo usan los encabezados de los reportes.

/** Formato de auditoría: HH:MM, DD/MM/AAAA */
export const formatAuditDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  const hhmm = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${hhmm}, ${date.toLocaleDateString("es-CO")}`;
};

/** Solo fecha: DD/MM/AAAA */
export const formatDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO") : "—");

/**
 * Fecha sin hora almacenada como DATE en la BD.
 * timeZone UTC a propósito: sin esto, en UTC-5 restaría un día.
 */
export const formatDateOnly = (d) =>
  d ? new Date(d).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—";

/**
 * (p50) Una fecha cualquiera en AAAA-MM-DD, en hora LOCAL.
 *
 * Es el formato que entiende un <input type="date"> y el que sirve para comparar
 * fechas de calendario sin que la zona horaria reste un día. "en-CA" no es un
 * capricho: es el locale cuyo formato corto ya es ISO.
 *
 * Sin argumento devuelve hoy.
 */
export const isoLocal = (d = new Date()) => new Date(d).toLocaleDateString("en-CA");

/**
 * (p50) Fecha de calendario de un DATE de la BD, en AAAA-MM-DD.
 *
 * Es la hermana en UTC de `isoLocal`, y las dos hacen falta a la vez: una fecha
 * guardada como DATE es medianoche UTC, así que su día real solo se lee en UTC;
 * pero "hoy" es el día de quien mira, que es local. Compararlas es comparar la
 * fecha del dato con la fecha de la persona, y cada una se lee en su huso.
 */
export const isoUtc = (d) =>
  d ? new Date(d).toLocaleDateString("en-CA", { timeZone: "UTC" }) : "";

/** Sufijo para nombres de archivo: AAAA-MM-DD */
export const fileStamp = () => isoLocal();
