// Orquesta el reporte de materiales de consumo. La generación del archivo (y su
// encabezado con sistema, fecha/hora, usuario y totales) la hace el generador
// compartido: ver shared/reports/generateReport.

import { buildReportDataset } from "../utils/buildReportDataset";
import { generateReport } from "@/shared/reports/generateReport";

export function generateConsumableReport({
  materials,
  format,
  selectedFields,
  scope,
  documentNumber,
  statusLabel,
}) {
  const { headers, rows } = buildReportDataset({
    consumableMaterials: materials,
    selectedFields,
    scope,
    placa_sena: documentNumber,
  });

  return generateReport({
    format,
    title: "Reporte de materiales de consumo",
    fileBase: "materiales-consumo",
    sheetName: "Consumibles",
    headers,
    rows,
    filters: [
      { label: "Estado del registro", value: statusLabel },
      {
        label: "Alcance",
        value: scope === "placa_sena" && documentNumber
          ? `Material con placa SENA ${documentNumber}`
          : "Todos los materiales listados",
      },
    ],
  });
}
