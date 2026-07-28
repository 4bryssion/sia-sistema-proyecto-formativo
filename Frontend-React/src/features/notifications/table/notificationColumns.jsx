import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/shared";
import { ListFilter, Eye } from "lucide-react";
import { SEVERITY_OPTIONS, getSeverityLabel, formatAuditDate } from "../utils/severityLabel";

// Header de "Criticidad" con filtro, mismo patrón que materiales y préstamos:
// Dropdown compartido en portal fixed → se superpone a la tabla sin romperla
function SeverityFilterHeader({ column }) {
  const current = column.getFilterValue();

  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer hover:opacity-70"
          aria-label="Filtrar por criticidad"
        >
          Criticidad
          <ListFilter size={16} className={current ? "text-primary" : ""} />
        </button>
      </DropdownTrigger>

      <DropdownContent className="w-48">
        <DropdownItem
          onClick={() => column.setFilterValue(undefined)}
          className={!current ? "font-semibold" : ""}
        >
          Todas
        </DropdownItem>
        {SEVERITY_OPTIONS.map((s) => (
          <DropdownItem
            key={s}
            onClick={() => column.setFilterValue(s)}
            className={current === s ? "font-semibold" : ""}
          >
            {getSeverityLabel(s)}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

export const notificationColumns = (onView) => [
  { accessorKey: "title", header: "Título" },
  {
    id: "severity",
    accessorFn: (row) => row.severity,
    filterFn: "equals",
    header: ({ column }) => <SeverityFilterHeader column={column} />,
    cell: ({ row }) => getSeverityLabel(row.original.severity),
  },
  { accessorKey: "module", header: "Módulo" },
  {
    id: "user",
    header: "Responsable",
    cell: ({ row }) => {
      const u = row.original.user;
      return u ? `${u.userFirstName} ${u.userLastName}` : "Sistema";
    },
  },
  {
    id: "created_at",
    header: "Fecha",
    // Formato de auditoría del proyecto: HH:MM, DD/MM/AAAA
    cell: ({ row }) => formatAuditDate(row.original.created_at),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <button
        onClick={() => onView(row.original)}
        className="p-1 rounded hover:bg-gray-900 cursor-pointer"
        title="Ver detalle"
      >
        <Eye size={16} />
      </button>
    ),
  },
];
