import { Switch, Alert } from "@/shared";
import UserRowActions from "../components/UserRowActions";
import { getTopGroupName } from "@/shared/utils/topGroup";
import userService from "@/shared/services/userService";

// onView / onEdit: abren los modales de ListUserPage. Antes estas acciones
// navegaban a /view/users/:id, rutas que ya no existen.
// onReactivate: lo maneja ListUserPage, que es quien monta el modal de fechas.
// Reactivar NO se puede resolver aquí: el backend exige `userStartDate` y
// `userEndDate` nuevas y hay que pedírselas al usuario.
export const UserColumns = (onChanged, can = () => true, onView, onEdit, onReactivate) => [
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
    id: "fechaInicio",
    header: "Fecha de inicio",
    // (p48) Campo propio del usuario, no la fecha de creación del registro:
    // antes de ella el login rechaza aunque las credenciales sean correctas
    accessorFn: (row) =>
      row.userStartDate ? new Date(row.userStartDate).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—",
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
        // (p48) Las dos direcciones dejaron de ser simétricas:
        //
        // - REACTIVAR exige fechas nuevas, así que no se resuelve con una
        //   confirmación: abre el modal que las pide.
        // - DESACTIVAR antes de tiempo ADELANTA la fecha de finalización a hoy.
        //   Es un efecto que el usuario no pidió y que no se puede deshacer sin
        //   volver a escribir las fechas, así que se avisa ANTES en el propio
        //   texto de la confirmación.
        if (!u.isActive) {
          onReactivate?.(u);
          return;
        }

        const hoy = new Date().toLocaleDateString("en-CA");
        const finFuturo =
          u.userEndDate &&
          new Date(u.userEndDate).toLocaleDateString("en-CA", { timeZone: "UTC" }) > hoy;

        const result = await Alert.warning(
          "¿Desactivar usuario?",
          `${u.userFirstName} ${u.userLastName} quedará inactivo y no podrá iniciar sesión.` +
            (finFuturo
              ? " Su fecha de finalización se adelantará a hoy, así que para reactivarlo habrá que indicar una vigencia nueva."
              : ""),
        );
        if (!result.isConfirmed) return;
        try {
          await userService.toggle(u.id);
          Alert.success("Usuario desactivado");
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