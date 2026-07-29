// Campos disponibles en el reporte de tareas.
// Misma forma que los demás módulos: { key, label, default, accessor? }.

import { TASK_STATUS_LABELS } from "../../constants/taskStatus";
import { formatDate, formatDateOnly } from "@/shared/utils/formatDate";

export const taskReportFields = [
  { key: "taskName", label: "Título", default: true },
  { key: "description", label: "Descripción", default: true },
  {
    key: "encargado",
    label: "Encargado",
    default: true,
    accessor: (t) =>
      t.user ? `${t.user.userFirstName} ${t.user.userLastName}` : "—",
  },
  {
    key: "estado",
    label: "Estado",
    default: true,
    accessor: (t) => TASK_STATUS_LABELS[t.status] ?? t.status,
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
