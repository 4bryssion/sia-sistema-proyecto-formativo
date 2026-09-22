import { useState } from "react";
import { Checkbox, Alert, usePermissions } from "@/shared";
import taskService from "@/shared/services/taskService";
// endDate es @db.Date (medianoche UTC): `formatDateOnly` lo formatea en UTC, o
// la zona horaria local le restaría un día.
import { formatDateOnly } from "@/shared/utils/formatDate";
import TaskRowActions from "../components/TaskRowActions";
import { getTaskStatusLabel } from "../constants/taskStatus";

/**
 * Casilla de estado del listado.
 *
 * (p50) Qué cambió y por qué:
 *
 * 1. Antes se le pasaba `disabled`, pero el componente Checkbox recibe la prop
 *    `disable`. La casilla nunca se veía gris: parecía pulsable y al pulsarla no
 *    pasaba nada, en silencio, porque el manejador salía antes de hacer nada.
 *    De ahí venía la sensación de que ni siquiera el SADMIN podía usarla.
 * 2. Una tarea vencida sí se ve gris ahora, y al pulsarla explica por qué no se
 *    puede cambiar en vez de no hacer nada.
 * 3. El `catch` estaba vacío: un fallo del servidor se veía igual que un éxito.
 *    Ahora se avisa.
 * 4. Usa la ruta de solo-estado, no el PUT de editar: así la persona que tiene
 *    la tarea asignada puede cerrarla sin tener permiso para reescribirla.
 */
function StatusCheckboxCell({ task, onChanged }) {
  const { can } = usePermissions();
  const [ocupado, setOcupado] = useState(false);

  const completada = task.status === "completada";
  const vencida = task.status === "no_completada";
  const inactiva = !task.isActive;
  // Quien gestiona tareas, o la persona a la que está asignada.
  const puedeMarcar = can("edit_task") || can("manage_own_tasks");

  const bloqueada = vencida || inactiva || !puedeMarcar;

  const explicarBloqueo = () => {
    if (vencida) {
      Alert.error(
        "La tarea venció",
        `"${task.taskName}" tenía como fecha límite el ${formatDateOnly(task.endDate)} y se cerró `
        + "como no completada al pasar esa fecha. Su estado ya no puede cambiarse.",
      );
      return;
    }
    if (inactiva) {
      Alert.error(
        "La tarea está inactiva",
        `"${task.taskName}" fue desactivada. Actívala de nuevo para poder cambiar su estado.`,
      );
      return;
    }
    Alert.error(
      "Sin permiso",
      "No tienes permiso para cambiar el estado de esta tarea.",
    );
  };

  const cambiar = async () => {
    setOcupado(true);
    try {
      await taskService.setStatus(task.id, completada ? "en_progreso" : "completada");
      onChanged?.();
    } catch (err) {
      Alert.error(
        "No se pudo cambiar el estado",
        err.response?.data?.error ?? "Inténtalo de nuevo en unos momentos.",
      );
      // Se recarga igual: si el rechazo vino de que la tarea ya había vencido,
      // la fila debe reflejar el estado real y no el que se intentó poner.
      onChanged?.();
    } finally {
      setOcupado(false);
    }
  };

  return (
    // El clic del caso bloqueado lo recoge el contenedor y no la casilla: un
    // input deshabilitado no dispara eventos en ningún navegador, así que sin
    // esto la alerta no llegaría a salir nunca.
    <div
      className="flex items-center gap-2"
      onClick={bloqueada ? explicarBloqueo : undefined}
      role={bloqueada ? "button" : undefined}
      tabIndex={bloqueada ? 0 : undefined}
      onKeyDown={bloqueada ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); explicarBloqueo(); } } : undefined}
    >
      <Checkbox
        checked={completada}
        disable={bloqueada || ocupado}
        onChange={cambiar}
        className={bloqueada ? "pointer-events-none" : ""}
      />
      <span className="font-secondary text-medium">{getTaskStatusLabel(task.status)}</span>
    </div>
  );
}

export const TaskColumns = (onChanged, onView, onEdit) => [
  // Sin columna de ID: el registro se identifica por su nombre; el id solo
  // viaja internamente para abrir el modal o llamar al servicio.
  { accessorKey: "taskName", header: "Título" },
  { accessorKey: "description", header: "Descripción" },
  {
    id: "assignee",
    header: "Encargado",
    accessorFn: (row) =>
      row.user ? `${row.user.userFirstName} ${row.user.userLastName}` : "—",
  },
  {
    id: "endDate",
    header: "Fecha de fin",
    accessorFn: (row) => formatDateOnly(row.endDate),
  },
  {
    id: "estado",
    header: "Estado",
    accessorFn: (row) => getTaskStatusLabel(row.status),
    cell: ({ row }) => (
      <StatusCheckboxCell task={row.original} onChanged={onChanged} />
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <TaskRowActions
        tasks={row.original}
        onChanged={onChanged}
        onView={onView}
        onEdit={onEdit}
      />
    ),
  },
];
