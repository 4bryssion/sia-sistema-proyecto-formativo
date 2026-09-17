// Orquesta el reporte de materiales devolutivos. La generación del archivo (y su
// encabezado con sistema, fecha/hora, usuario y totales) la hace el generador
// compartido: ver shared/reports/generateReport.

import { buildReportDataset } from "../utils/buildReportDataset";
import { generateReport } from "@/shared/reports/generateReport";

export function generateReturnableReport({
  materials,
  format,
  selectedFields,
  scope,
  documentNumber,
  statusLabel,
  // (p48) Ids de los inventarios elegidos en el modal; vacío = todos
  inventoryIds = [],
  inventoryLabels = [],
}) {
  const { headers, rows } = buildReportDataset({
    returnableMaterials: materials,
    selectedFields,
    scope,
    placa_sena: documentNumber,
    inventoryIds,
  });

  return generateReport({
    format,
    title: "Reporte de materiales devolutivos",
    fileBase: "materiales-devolutivos",
    sheetName: "Devolutivos",
    headers,
    rows,
    filters: [
      { label: "Estado del registro", value: statusLabel },
      // El encabezado dice sobre qué inventarios se hizo el reporte: sin esta
      // línea, dos reportes con distinto filtro son indistinguibles en papel
      {
        label: "Inventarios",
        value: inventoryLabels.length ? inventoryLabels.join(", ") : "Todos",
      },
      {
        label: "Alcance",
        value: scope === "placa_sena" && documentNumber
          ? `Material con placa SENA ${documentNumber}`
          : "Todos los materiales listados",
      },
    ],
  });
}
