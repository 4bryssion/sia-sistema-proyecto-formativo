// Campos disponibles en el reporte de tareas.
// Misma forma que los demás módulos: { key, label, default, accessor? }.

import { textoBusquedaEncargados, etiquetaEstado, etiquetaAvance } from "../../utils/asignaciones";
import { formatDate, formatDateOnly } from "@/shared/utils/formatDate";

export const taskReportFields = [
  { key: "taskName", label: "Título", default: true },
  { key: "description", label: "Descripción", default: true },
  {
    key: "encargado",
    label: "Encargados",
    default: true,
    // (p51) Aquí sí van TODOS los nombres, no el recuento: en un reporte hay
    // sitio, y "5 personas" en una celda de Excel no sirve para nada.
    accessor: (t) => textoBusquedaEncargados(t),
  },
  {
    key: "estado",
    label: "Estado",
    default: true,
    accessor: (t) => etiquetaEstado(t),
  },
  {
    // (p51) Columna nueva: con varios encargados, el estado derivado no dice
    // cuántos van. Por defecto no entra, para no cambiar el reporte de quien
    // asigna tareas de una en una.
    key: "avance",
    label: "Avance",
    default: false,
    accessor: (t) => etiquetaAvance(t) ?? "—",
  },
  {
    // La fecha de inicio de una tarea es su fecha de creación (ver CLAUDE.md §7.2)
    key: "created_at",
    label: "Fecha de inicio",
    default: true,
    accessor: (t) => formatDate(t.created_at),
  },
  {
    key: "endDate",
    label: "Fecha de fin",
    default: true,
    accessor: (t) => formatDateOnly(t.endDate),
  },
  {
    key: "isActive",
    label: "Registro",
    default: false,
    accessor: (t) => (t.isActive ? "Activo" : "Inactivo"),
  },
];
