import { Switch, Alert } from "@/shared";
import ConsumableMaterialRowActions from "../components/ConsumableMaterialRowActions";
import consumableMaterialService from "../services/consumableMaterialService";
import { getStatusLabel } from "../utils/statusLabel";

// onView / onEdit: abren los modales de ListConsumableMaterialPage. Antes
// estas acciones navegaban a /view/consumable-materials/:id, rutas que ya no existen.
export const consumableMaterialColumns = (refetch, can = () => true, onView, onEdit) => [
  // Sin columna de ID: el registro se identifica por su nombre; el id solo
  // viaja internamente para abrir el modal o llamar al servicio.
  {
    accessorKey: "materialName",
    header: "Nombre",

     // Cambio: doble clic en el id navega a visualizar el material consumible
    // según observación del instructor, para evitar redirecciones accidentales
    cell: ({ row }) => {
      const consumable = row.original;

      return (
        <span
          onDoubleClick={() => onView?.(consumable.id)}
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
    // El filtro por estado vive ahora en la barra de la tabla (FilterMenu),
    // no en la cabecera: ver ListConsumableMaterialPage
    accessorFn: (row) => row.status,
    header: "Estado",
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
      <ConsumableMaterialRowActions consumableMaterial={row.original} onView={onView} onEdit={onEdit} />
    ),
  },
];