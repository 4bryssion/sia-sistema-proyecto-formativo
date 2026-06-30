import { buildReportDataset } from "../utils/buildReportDataset";
import { generateExcelReport } from "./generateExcelReport";
import { generatePdfReport } from "./generatePdfReport";

export function generateReturnableReport({
  materials,
  format,
  selectedFields,
  scope,
  documentNumber,
}) {
  const { headers, rows } = buildReportDataset({
    returnableMaterials: materials,
    selectedFields,
    scope,
    placa_sena: documentNumber,
  });

  if (!rows.length) {
    alert("No hay datos para generar el reporte.");
    return;
  }

  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === "excel") {
    generateExcelReport({
      headers,
      rows,
      fileName: `returnableMaterials-report-${timestamp}.xlsx`,
    });
  }

  if (format === "pdf") {
    generatePdfReport({
      headers,
      rows,
      fileName: `returnableMaterials-report-${timestamp}.pdf`,
    });
  }
}
