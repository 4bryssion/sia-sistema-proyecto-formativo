import { Switch, Alert } from "@/shared";
import UserRowActions from "../components/UserRowActions";
import { getTopGroupName } from "../utils/topGroup";
import userService from "../services/userService";

// onView / onEdit: abren los modales de ListUserPage. Antes estas acciones
// navegaban a /view/users/:id, rutas que ya no existen.
export const UserColumns = (onChanged, can = () => true, onView, onEdit) => [
  // Sin columna de ID: el registro se identifica por su nombre; el id solo
  // viaja internamente para abrir el modal o llamar al servicio.
  {
    id: "nombre",
    header: "Nombre",
    accessorFn: (row) => `${row.userFirstName} ${row.userLastName}`,
    cell: ({ row }) => {
      const u = row.original;

      // Cambio: se reemplaza la apertura de un solo clic por doble clic
      // según observación del instructor, para evitar aperturas accidentales
      return (
        <span
          onDoubleClick={() => onView?.(u.id)}
          className="cursor-pointer hover:underline"
        >
          {u.userFirstName} {u.userLastName}
        </span>
      );
    },
  },
  {
    // "Grupo" y no "Rol": el sistema decide por permisos, no por nombre de rol,
    // y un usuario puede pertenecer a varios grupos (aquí se muestra el principal)
    id: "grupo",
    header: "Grupo",
    accessorFn: (row) => getTopGroupName(row),
  },
  {
    // Tipo de usuario = userAccountType (Cuentadante | Solidario).
    // accessorKey (no accessorFn) para que el filtro por columna funcione
    // con setFilterValue desde el menú de la barra de herramientas.
    accessorKey: "userAccountType",
    id: "userAccountType",
    header: "Tipo de usuario",
    cell: ({ getValue }) => getValue() ?? "—",
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
    cell: ({ row }) => <UserRowActions users={row.original} onView={onView} onEdit={onEdit} />,
  },
];