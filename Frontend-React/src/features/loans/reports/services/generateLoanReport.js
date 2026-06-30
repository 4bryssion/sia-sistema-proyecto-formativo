import { buildReportDataset } from "../utils/buildReportDataset";
import { generateExcelReport } from "./generateExcelReport";
import { generatePdfReport } from "./generatePdfReport";

export function generateLoanReport({
  format,
  selectedFields,
  scope,
  usuario,
  loans = [],
}) {
  const { headers, rows } = buildReportDataset({
    loans,
    selectedFields,
    scope,
    usuario,
  });

  if (!rows.length) {
    alert("No hay datos para generar reporte.");
    return;
  }

  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === "excel") {
    generateExcelReport({ headers, rows, fileName: `loan-report.${timestamp}.xlsx` });
  }
  if (format === "pdf") {
    generatePdfReport({ headers, rows, fileName: `loan-report.${timestamp}.pdf` });
  }
}
