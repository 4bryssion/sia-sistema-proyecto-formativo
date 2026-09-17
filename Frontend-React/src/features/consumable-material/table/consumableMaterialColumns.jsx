import { Switch, Alert } from "@/shared";
import ConsumableMaterialRowActions from "../components/ConsumableMaterialRowActions";
import consumableMaterialService from "@/shared/services/consumableMaterialService";
import { getStatusLabel } from "@/shared/utils/materialStatusLabel";
import { formatAccountables } from "@/shared/utils/accountables";

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
    // (p48) La marca pasó a opcional: hay material sin ella.
    // accessorFn para que el buscador global la encuentre: TanStack excluye del
    // filtro toda columna que no tenga accessor.
    accessorFn: (row) => row.brand?.brandName ?? "",
    cell: ({ row }) => row.original.brand?.brandName ?? "—",
  },
  {
    id: "inventory",
    header: "Inventario",
    // accessorFn para que el buscador global de la tabla encuentre por inventario
    accessorFn: (row) => row.inventory?.inventoryName ?? "",
    cell: ({ row }) => row.original.inventory?.inventoryName ?? "—",
  },
  {
    id: "quantity",
    header: "Cantidad",
    // Serializados (placa SENA, quantity null) → cantidad efectiva 1 (modelo de stock)
    cell: ({ row }) => row.original.quantity ?? 1,
  },
  {
    id: "accountables",
    header: "Cuentadante",
    // (p48) Ya no es un usuario suelto sino una lista. En una celda no caben
    // todos, así que se muestra el primero y cuántos más; el modal de consulta
    // los enseña completos.
    accessorFn: (row) => formatAccountables(row.accountables),
    cell: ({ row }) => formatAccountables(row.original.accountables),
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