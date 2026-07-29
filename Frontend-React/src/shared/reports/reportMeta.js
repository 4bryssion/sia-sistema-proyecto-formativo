// Metadatos del encabezado de los reportes.
//
// Los requerimientos los exigen explícitamente (RFADMIN13, RFADMIN19, RFADMIN26 y
// la regla transversal 6): "encabezado con nombre del sistema, fecha/hora de
// generación y usuario generador". Antes cada módulo escribía a mano una línea
// suelta con la fecha; ahora los cuatro (y los que vengan) comparten esta función.

import { formatAuditDate } from "@/shared/utils/formatDate";
import { getCurrentUserLabel } from "@/shared/services/authStorage";

export const SYSTEM_NAME = "S.I.I — Software de Inventario de Infraestructura";

/**
 * Construye las líneas del encabezado.
 *
 * @param {object} p
 * @param {string} p.title    "Reporte de usuarios", "Reporte de préstamos"...
 * @param {number} p.total    Cantidad de registros incluidos
 * @param {Array<{label:string, value:string}>} [p.filters]  Filtros aplicados
 * @returns {Array<[string, string]>} pares etiqueta/valor, en orden
 */
export function buildReportMeta({ title, total, filters = [] }) {
  const meta = [
    ["Sistema", SYSTEM_NAME],
    ["Reporte", title],
    // Formato de auditoría del proyecto: HH:MM, DD/MM/AAAA
    ["Fecha y hora de generación", formatAuditDate(new Date())],
    // Nombre completo del usuario; cae al correo si aún no se resolvió
    // (ver authStorage.getCurrentUserLabel)
    ["Generado por", getCurrentUserLabel()],
    ["Total de registros", String(total)],
  ];

  // Los filtros aplicados van al final y solo si existen: un reporte sin filtros
  // no debe mostrar líneas vacías
  for (const f of filters) {
    if (f?.value) meta.push([f.label, f.value]);
  }

  return meta;
}
