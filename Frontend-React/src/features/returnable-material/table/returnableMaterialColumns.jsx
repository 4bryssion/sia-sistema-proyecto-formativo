import { Switch } from "@/shared";
import ReturnableMaterialRowActions from "../components/ReturnableMaterialRowActions";
import returnableMaterialService from "../services/returnableMaterialService";
import { getStatusLabel } from "../utils/statusLabel";

export const returnableMaterialColumns = (refetch) => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    id: "materialName",
    header: "Nombre",
    cell: ({ row }) => row.original.consumableMaterial?.materialName ?? "—",
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
    cell: ({ row }) => getStatusLabel(row.original.consumableMaterial?.status),
  },
  {
    id: "isActive",
    header: "Activo",
    cell: ({ row }) => {
      const m = row.original;
      const handleToggle = async () => {
        try {
          await returnableMaterialService.toggle(m.id);
          refetch();
        } catch (err) {
          console.error("Error al cambiar estado:", err);
        }
      };
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
