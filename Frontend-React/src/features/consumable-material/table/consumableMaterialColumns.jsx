import { Switch } from "@/shared";
import ConsumableMaterialRowActions from "../components/ConsumableMaterialRowActions";
import consumableMaterialService from "../services/consumableMaterialService";
import { getStatusLabel } from "../utils/statusLabel";

export const consumableMaterialColumns = (refetch) => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "materialName",
    header: "Nombre",
  },
  {
    id: "brand",
    header: "Marca",
    cell: ({ row }) => row.original.brand?.brandName ?? "—",
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
    header: "Estado",
    cell: ({ row }) => getStatusLabel(row.original.status),
  },
  {
    accessorKey: "isActive",
    header: "Activo",
    cell: ({ row }) => {
      const m = row.original;
      const handleToggle = async () => {
        try {
          await consumableMaterialService.toggle(m.id);
          refetch();
        } catch (err) {
          console.error("Error al cambiar estado:", err);
        }
      };
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
