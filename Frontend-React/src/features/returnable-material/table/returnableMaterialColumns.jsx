import { Switch, Alert } from "@/shared";
import ReturnableMaterialRowActions from "../components/ReturnableMaterialRowActions";
import returnableMaterialService from "@/shared/services/returnableMaterialService";
import { getStatusLabel } from "@/shared/utils/materialStatusLabel";
import { formatAccountables } from "@/shared/utils/accountables";

// El filtro por estado ya no vive en la cabecera de esta columna: se movió a la
// barra de la tabla (FilterMenu en `toolbarExtra`), igual que en usuarios y
// consumibles. Allí filtra el array ANTES de entregarlo a DataTable, así que el
// buscador, la paginación, el contador y el reporte trabajan sobre el conjunto
// ya filtrado — cosa que el filtro por columna de TanStack no lograba.
export const returnableMaterialColumns = (refetch, can = () => true, onView, onEdit) => [
    {
        id: "materialName",
        header: "Nombre", // Encabezado visible
        // accessorFn OBLIGATORIO aunque haya `cell`: TanStack excluye del
        // buscador global toda columna sin accessor (getCanGlobalFilter exige
        // column.accessorFn), y sin esto escribir el nombre de un material no
        // devolvía ninguna fila.
        accessorFn: (row) => row.consumableMaterial?.materialName ?? "",
        cell: ({ row }) => {
            const returnable = row.original;

            return (
            // Doble clic abre el modal de consulta. Antes navegaba con
            // window.location a una ruta construida con el NOMBRE del material,
            // que además ya no existe (visualizar dejó de ser una página).
            <span
                onDoubleClick={() => onView?.(returnable.id)}
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
    accessorFn: (row) => row.category?.categoryName ?? "",
    cell: ({ row }) => row.original.category?.categoryName ?? "—",
  },
  {
    id: "inventory",
    header: "Inventario",
    // (p48) El inventario cuelga de la tabla padre, como el resto de lo común.
    // accessorFn para que el buscador global lo encuentre.
    accessorFn: (row) => row.consumableMaterial?.inventory?.inventoryName ?? "",
    cell: ({ row }) => row.original.consumableMaterial?.inventory?.inventoryName ?? "—",
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
    // (p48) Ya no es un usuario suelto sino una lista, y cuelga de la tabla
    // padre. En una celda no caben todos: el primero y cuántos más.
    accessorFn: (row) => formatAccountables(row.consumableMaterial?.accountables),
    cell: ({ row }) => formatAccountables(row.original.consumableMaterial?.accountables),
  },
  {
    id: "status",
    header: "Estado",
    // accessorFn se mantiene: es lo que permite al buscador global de la tabla
    // encontrar por estado, aunque el valor viva dentro de consumableMaterial
    accessorFn: (row) => row.consumableMaterial?.status,
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
      <ReturnableMaterialRowActions
        returnableMaterial={row.original}
        onView={onView}
        onEdit={onEdit}
      />
    ),
  },
];
