import { Switch, Dropdown, DropdownTrigger, DropdownContent, DropdownItem, Alert } from "@/shared";
import { ListFilter } from "lucide-react";
import ReturnableMaterialRowActions from "../components/ReturnableMaterialRowActions";
import returnableMaterialService from "../services/returnableMaterialService";
import { getStatusLabel } from "../utils/statusLabel";

// Estados disponibles para el filtro del header (mismo catálogo que statusLabel)
const STATUS_OPTIONS = [
  "Disponible",
  "No_disponible",
  "Mantenimiento",
  "En_prestamo",
  "Traslado",
  "Baja",
];

// Header de "Estado" con icono de filtro: mismo patrón que consumibles — usa el
// Dropdown compartido; su contenido va en portal fixed y se superpone a la tabla
function StatusFilterHeader({ column }) {
  const current = column.getFilterValue();

  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer hover:opacity-70"
          aria-label="Filtrar por estado"
        >
          Estado
          <ListFilter size={16} className={current ? "text-primary" : ""} />
        </button>
      </DropdownTrigger>

      {/* w-48 fijo: sin él, el menú del portal se estira demasiado */}
      <DropdownContent className="w-48">
        <DropdownItem
          onClick={() => column.setFilterValue(undefined)}
          className={!current ? "font-semibold" : ""}
        >
          Todos
        </DropdownItem>
        {STATUS_OPTIONS.map((s) => (
          <DropdownItem
            key={s}
            onClick={() => column.setFilterValue(s)}
            className={current === s ? "font-semibold" : ""}
          >
            {getStatusLabel(s)}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

export const returnableMaterialColumns = (refetch, can = () => true) => [
  // {
  //   accessorKey: "id",
  //   header: "ID",
  // },
    {
        id: "materialName",
        header: "Nombre", // Encabezado visible
        cell: ({ row }) => {
            const returnable = row.original;

            const handleDoubleClick = () => {
            window.location.href = `/view/returnable-material/${returnable.materialName}`;
            };

            return (
            <span
                onDoubleClick={handleDoubleClick}
                className="cursor-pointer hover:underline"
            >
                {returnable.consumableMaterial?.materialName ?? "—"}
            </span>
            );
        },
    },
  {
    id: "category",
    header: "Categoría",
    cell: ({ row }) => row.original.category?.categoryName ?? "—",
  },
  {
    id: "quantity",
    header: "Cantidad",
    // Serializados (placa SENA, quantity null) → cantidad efectiva 1 (modelo de stock)
    cell: ({ row }) => row.original.consumableMaterial?.quantity ?? 1,
  },
  {
    id: "accountant",
    header: "Cuentadante",
    cell: ({ row }) => {
      const u = row.original.consumableMaterial?.user;
      return u ? `${u.userFirstName} ${u.userLastName}` : "—";
    },
  },
  {
    id: "status",
    // accessorFn + filterFn "equals" habilitan el filtro por columna del header
    accessorFn: (row) => row.consumableMaterial?.status,
    filterFn: "equals",
    header: ({ column }) => <StatusFilterHeader column={column} />,
    cell: ({ row }) => getStatusLabel(row.original.consumableMaterial?.status),
  },
  {
    id: "isActive",
    header: "Activo",
    cell: ({ row }) => {
      const m = row.original;
      const handleToggle = async () => {
        const active = m.consumableMaterial?.isActive ?? false;
        // Confirmación obligatoria antes de activar/desactivar (soft-delete)
        const result = await Alert.warning(
          `¿${active ? "Desactivar" : "Activar"} material?`,
          `"${m.consumableMaterial?.materialName ?? ""}" quedará ${active ? "inactivo" : "activo nuevamente"}.`
        );
        if (!result.isConfirmed) return;
        try {
          await returnableMaterialService.toggle(m.id);
          Alert.success(`Material ${active ? "desactivado" : "activado"}`);
          refetch();
        } catch (err) {
          Alert.error("Error al cambiar estado", err.response?.data?.error ?? "");
        }
      };
      // Sin permiso de toggle: solo lectura
      if (!can("toggle_returnable_material")) return (m.consumableMaterial?.isActive ?? false) ? "Activo" : "Inactivo";
      return (
        <Switch
          checked={m.consumableMaterial?.isActive ?? false}
          onChange={handleToggle}
          className="inline-flex"
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ReturnableMaterialRowActions returnableMaterial={row.original} />
    ),
  },
];
