import { Eye } from "lucide-react";
import { IconButton } from "@/shared";
import { formatAuditDate } from "@/shared/utils/formatDate";
import { getSeverityLabel, getModuleLabel } from "../utils/notificationLabels";

// (p50) El filtro de criticidad salió de la cabecera de la columna y subió a la
// barra de herramientas, junto al buscador, como en usuarios y materiales. Aquí
// solo quedan las columnas.
export const notificationColumns = (onView) => [
  { accessorKey: "title", header: "Título" },
  {
    id: "severity",
    accessorFn: (row) => row.severity,
    header: "Criticidad",
    cell: ({ row }) => getSeverityLabel(row.original.severity),
  },
  {
    id: "module",
    accessorFn: (row) => getModuleLabel(row.module),
    header: "Módulo",
  },
  {
    id: "user",
    // accessorFn y no solo cell: sin esto el buscador de la tabla no encuentra
    // por el nombre de la persona, que es justo por donde se busca.
    accessorFn: (row) =>
      row.user ? `${row.user.userFirstName} ${row.user.userLastName}` : "Sistema",
    header: "Responsable",
  },
  {
    id: "created_at",
    accessorFn: (row) => formatAuditDate(row.created_at),
    header: "Fecha",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <IconButton
        ariaLabel="Ver detalle de la notificación"
        hitSize={36}
        iconSize={16}
        onClick={() => onView(row.original)}
      >
        <Eye size={16} />
      </IconButton>
    ),
  },
];
