import { Switch } from "@/shared";
import UserRowActions from "../components/UserRowActions";
import { getTopGroupName } from "../utils/topGroup";
import userService from "../services/userService";
import { Link } from "react-router-dom";

export const UserColumns = (onChanged) => [
  { accessorKey: "id", header: "Id" },
  {
    id: "nombre",
    header: "Nombre",
    accessorFn: (row) => `${row.userFirstName} ${row.userLastName}`,
    cell: ({ row }) => {
      const u = row.original;
      return (
        <Link
          to={`/view/users/${u.id}`}
        >
          {u.userFirstName} {u.userLastName}
        </Link>
      );
    },
  },
  {
    id: "tipoUsuario",
    header: "Tipo de usuario",
    accessorFn: (row) => getTopGroupName(row),
  },
  {
    id: "fechaFin",
    header: "Fecha de finalización",
    accessorFn: (row) =>
      row.userEndDate ? new Date(row.userEndDate).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—",
  },
  {
    id: "estado",
    header: "Activo",
    cell: ({ row }) => {
      const u = row.original;
      const handleToggle = async () => {
        try { await userService.toggle(u.id); } finally { onChanged?.(); }
      };
      return( <div className="flex items-center h-full"><Switch checked={u.isActive} onChange={handleToggle} size="sm" className="inline-flex" />
      </div> 
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <UserRowActions users={row.original} />,
  },
];
