// Generación de reportes en Excel y PDF — única implementación del proyecto.
//
// Antes cada módulo (usuarios, consumibles, devolutivos, préstamos) tenía su
// propio par generateExcelReport/generatePdfReport prácticamente idéntico, con
// pequeñas diferencias de encabezado. Eso hacía que "añadir información al
// encabezado" fuera un cambio en cuatro sitios, y que tareas —que no tenía
// reportes— hubiera que escribirlo de cero por quinta vez.

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { buildReportMeta, SYSTEM_NAME } from "./reportMeta";
import { fileStamp } from "@/shared/utils/formatDate";
import { Alert } from "@/shared/components/utils/alert.js";

// Paleta del proyecto en RGB (jsPDF no entiende variables CSS)
const GREEN_DARK = [0, 120, 50];   // --sia-color-secondary-950
const GRAY_SOFT = [86, 86, 86];    // --color-gray-300

// ---------------------------------------------------------------- Excel
function toExcel({ meta, headers, rows, sheetName, fileName }) {
  // El encabezado va como pares etiqueta/valor en las primeras filas y luego
  // una fila en blanco: así la tabla sigue siendo legible por Excel como datos
  const worksheetData = [
    ...meta.map(([label, value]) => [label, value]),
    [],
    headers,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Ancho: la primera columna carga las etiquetas del encabezado, que son largas
  const columnCount = Math.max(headers.length, 2);
  worksheet["!cols"] = Array.from({ length: columnCount }, (_, i) => ({ wch: i === 0 ? 30 : 25 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

// ---------------------------------------------------------------- PDF
function toPdf({ meta, headers, rows, title, fileName }) {
  // landscape: los reportes con muchas columnas seleccionadas no caben en vertical
  const doc = new jsPDF({ orientation: headers.length > 6 ? "landscape" : "portrait" });
  const marginX = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...GREEN_DARK);
  doc.text(SYSTEM_NAME, marginX, 16);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(title, marginX, 24);

  // El resto del encabezado en gris y pequeño: es metadato, no contenido
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_SOFT);

  let y = 31;
  for (const [label, value] of meta) {
    // Sistema y Reporte ya salieron arriba como título
    if (label === "Sistema" || label === "Reporte") continue;
    doc.text(`${label}: ${value}`, marginX, y);
    y += 5;
  }

  autoTable(doc, {
    startY: y + 3,
    head: [headers],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: GREEN_DARK, textColor: 255, fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: marginX, right: marginX },
    // Numeración de página: un reporte impreso sin ella es inmanejable
    didDrawPage: (data) => {
      const page = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(...GRAY_SOFT);
      doc.text(
        `Página ${page}`,
        data.settings.margin.left,
        doc.internal.pageSize.getHeight() - 8,
      );
    },
  });

  doc.save(fileName);
}

/**
 * Punto de entrada único para generar un reporte.
 *
 * @param {object} p
 * @param {"excel"|"pdf"} p.format
 * @param {string}   p.title      "Reporte de usuarios"
 * @param {string}   p.fileBase   "usuarios" → usuarios-2026-07-29.pdf
 * @param {string}   [p.sheetName] Nombre de la hoja de Excel
 * @param {string[]} p.headers
 * @param {Array[]}  p.rows
 * @param {Array<{label:string,value:string}>} [p.filters] Filtros aplicados
 */
export function generateReport({ format, title, fileBase, sheetName, headers, rows, filters = [] }) {
  // Un archivo sin filas no se genera: descargar un reporte vacío parece un fallo
  // y el requerimiento pide avisar explícitamente
  if (!rows.length) {
    // Alert.error y no warning: warning abre un confirm que espera respuesta,
    // y aquí solo hay que informar
    Alert.error("Sin datos para el reporte", "Ningún registro coincide con los filtros seleccionados.");
    return false;
  }

  const meta = buildReportMeta({ title, total: rows.length, filters });
  const fileName = `${fileBase}-${fileStamp()}.${format === "excel" ? "xlsx" : "pdf"}`;

  if (format === "excel") {
    toExcel({ meta, headers, rows, sheetName: sheetName ?? title.slice(0, 31), fileName });
  } else {
    toPdf({ meta, headers, rows, title, fileName });
  }

  return true;
}
