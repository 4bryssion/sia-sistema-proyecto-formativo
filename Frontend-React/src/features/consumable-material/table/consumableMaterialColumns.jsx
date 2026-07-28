import { Switch, Dropdown, DropdownTrigger, DropdownContent, DropdownItem, Alert } from "@/shared";
import { ListFilter } from "lucide-react";
import ConsumableMaterialRowActions from "../components/ConsumableMaterialRowActions";
import consumableMaterialService from "../services/consumableMaterialService";
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

// Header de "Estado" con icono de filtro: usa el Dropdown compartido (mismo de
// row-actions y navbar). Su DropdownContent se renderiza en portal con position
// fixed, por lo que se superpone a la tabla sin romperla al abrirse.
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

      {/* w-48 fijo: sin él, el menú del portal se estiraba demasiado dentro del header */}
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

export const consumableMaterialColumns = (refetch, can = () => true) => [
  // {
  //   accessorKey: "id",
  //   header: "ID",
  // },
  {
    accessorKey: "materialName",
    header: "Nombre",

     // Cambio: doble clic en el id navega a visualizar el material consumible
    // según observación del instructor, para evitar redirecciones accidentales
    cell: ({ row }) => {
      const consumable = row.original;

      const handleDoubleClick = () => {
        window.location.href = `/view/consumable-materials/${consumable.materialName}`;
      };

      return (
        <span
          onDoubleClick={handleDoubleClick}
          className="cursor-pointer hover:underline"
        >
          {consumable.materialName}
        </span>
      );
    },
  },
  {
    id: "brand",
    header: "Marca",
    cell: ({ row }) => row.original.brand?.brandName ?? "—",
  },
  {
    id: "quantity",
    header: "Cantidad",
    // Serializados (placa SENA, quantity null) → cantidad efectiva 1 (modelo de stock)
    cell: ({ row }) => row.original.quantity ?? 1,
  },
  {
    id: "user",
    header: "Cuentadante",
    cell: ({ row }) => {
      const u = row.original.user;
      return u ? `${u.userFirstName} ${u.userLastName}` : "—";
    },
  },
  {
    id: "status",
    // accessorFn + filterFn "equals" habilitan el filtro por columna del header
    accessorFn: (row) => row.status,
    filterFn: "equals",
    header: ({ column }) => <StatusFilterHeader column={column} />,
    cell: ({ row }) => getStatusLabel(row.original.status),
  },
  {
    accessorKey: "isActive",
    header: "Activo",
    cell: ({ row }) => {
      const m = row.original;
      const handleToggle = async () => {
        // Confirmación obligatoria antes de activar/desactivar (soft-delete)
        const result = await Alert.warning(
          `¿${m.isActive ? "Desactivar" : "Activar"} material?`,
          `"${m.materialName}" quedará ${m.isActive ? "inactivo" : "activo nuevamente"}.`
        );
        if (!result.isConfirmed) return;
        try {
          await consumableMaterialService.toggle(m.id);
          Alert.success(`Material ${m.isActive ? "desactivado" : "activado"}`);
          refetch();
        } catch (err) {
          Alert.error("Error al cambiar estado", err.response?.data?.error ?? "");
        }
      };
      // Sin permiso de toggle: solo lectura
      if (!can("toggle_consumable_material")) return m.isActive ? "Activo" : "Inactivo";
      return <Switch checked={m.isActive} onChange={handleToggle} className="inline-flex" />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ConsumableMaterialRowActions consumableMaterial={row.original} />
    ),
  },
];