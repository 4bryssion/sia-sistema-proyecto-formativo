import { Switch, Alert } from "@/shared";
import UserRowActions from "../components/UserRowActions";
import { getTopGroupName } from "../utils/topGroup";
import userService from "../services/userService";
import { Link } from "react-router-dom";

export const UserColumns = (onChanged, can = () => true) => [
  // { accessorKey: "id", header: "Id" },
  {
    id: "nombre",
    header: "Nombre",
    accessorFn: (row) => `${row.userFirstName} ${row.userLastName}`,
    cell: ({ row }) => {
      const u = row.original;

      // Cambio: se reemplaza la navegación de un solo clic por doble clic
      // según observación del instructor, para evitar redirecciones accidentales
      const handleDoubleClick = () => {
        window.location.href = `/view/users/${u.id}`;
      };

      return (
        <span
          onDoubleClick={handleDoubleClick}
          className="cursor-pointer hover:underline"
        >
          {u.userFirstName} {u.userLastName}
        </span>
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
        // Confirmación obligatoria antes de activar/desactivar (soft-delete)
        const result = await Alert.warning(
          `¿${u.isActive ? "Desactivar" : "Activar"} usuario?`,
          `${u.userFirstName} ${u.userLastName} quedará ${u.isActive ? "inactivo y no podrá iniciar sesión" : "activo nuevamente"}.`
        );
        if (!result.isConfirmed) return;
        try {
          await userService.toggle(u.id);
          Alert.success(`Usuario ${u.isActive ? "desactivado" : "activado"}`);
        } catch (err) {
          Alert.error("Error al cambiar estado", err.response?.data?.error ?? "");
        } finally { onChanged?.(); }
      };
      // Sin permiso de toggle: solo lectura
      if (!can("toggle_user")) return u.isActive ? "Activo" : "Inactivo";
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