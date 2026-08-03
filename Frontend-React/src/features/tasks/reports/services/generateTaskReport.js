// Orquesta el reporte de tareas. El archivo y su encabezado (sistema, fecha/hora,
// usuario generador, totales) los produce el generador compartido.

import { generateReport } from "@/shared/reports/generateReport";
import { TASK_STATUS_LABELS } from "../../constants/taskStatus";

export function generateTaskReport({
  tasks = [],
  format,
  selectedFields,
  // Alcance: "all" o un estado concreto del enum TaskStatus
  scope = "all",
}) {
  const filtered = scope === "all" ? tasks : tasks.filter((t) => t.status === scope);

  const headers = selectedFields.map((f) => f.label);
  const rows = filtered.map((t) =>
    selectedFields.map((f) => (f.accessor ? f.accessor(t) : (t[f.key] ?? ""))),
  );

  return generateReport({
    format,
    title: "Reporte de tareas",
    fileBase: "tareas",
    sheetName: "Tareas",
    headers,
    rows,
    filters: [
      {
        label: "Alcance",
        value: scope === "all"
          ? "Todas las tareas listadas"
          : `Solo tareas en estado "${TASK_STATUS_LABELS[scope] ?? scope}"`,
      },
    ],
  });
}
