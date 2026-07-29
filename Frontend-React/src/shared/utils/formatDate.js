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

/** Sufijo para nombres de archivo: AAAA-MM-DD */
export const fileStamp = () => new Date().toLocaleDateString("en-CA");
