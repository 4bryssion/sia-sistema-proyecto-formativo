// Orquesta el reporte de préstamos. La generación del archivo (y su encabezado
// con sistema, fecha/hora, usuario y totales) la hace el generador compartido:
// ver shared/reports/generateReport.

import { buildReportDataset } from "../utils/buildReportDataset";
import { generateReport } from "@/shared/reports/generateReport";

export function generateLoanReport({
  format,
  selectedFields,
  scope,
  usuario,
  loans = [],
  statusLabel,
}) {
  const { headers, rows } = buildReportDataset({
    loans,
    selectedFields,
    scope,
    usuario,
  });

  return generateReport({
    format,
    title: "Reporte de préstamos",
    fileBase: "prestamos",
    sheetName: "Préstamos",
    headers,
    rows,
    filters: [
      { label: "Estado", value: statusLabel },
      {
        label: "Alcance",
        value: scope === "usuario" && usuario
          ? `Préstamos del usuario ${usuario}`
          : "Todos los préstamos listados",
      },
    ],
  });
}
