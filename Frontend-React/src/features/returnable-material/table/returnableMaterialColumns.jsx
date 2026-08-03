import { Switch, Alert } from "@/shared";
import ReturnableMaterialRowActions from "../components/ReturnableMaterialRowActions";
import returnableMaterialService from "../services/returnableMaterialService";
import { getStatusLabel } from "../utils/statusLabel";

// El filtro por estado ya no vive en la cabecera de esta columna: se movió a la
// barra de la tabla (FilterMenu en `toolbarExtra`), igual que en usuarios y
// consumibles. Allí filtra el array ANTES de entregarlo a DataTable, así que el
// buscador, la paginación, el contador y el reporte trabajan sobre el conjunto
// ya filtrado — cosa que el filtro por columna de TanStack no lograba.
export const returnableMaterialColumns = (refetch, can = () => true, onView, onEdit) => [
    {
        id: "materialName",
        header: "Nombre", // Encabezado visible
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
