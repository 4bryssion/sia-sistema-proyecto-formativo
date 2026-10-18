import { useState } from "react";
import { Checkbox, Alert, usePermissions } from "@/shared";
import taskService from "@/shared/services/taskService";
// endDate es @db.Date (medianoche UTC): `formatDateOnly` lo formatea en UTC, o
// la zona horaria local le restaría un día.
import { formatDateOnly } from "@/shared/utils/formatDate";
import TaskRowActions from "../components/TaskRowActions";
import {
  etiquetaEncargados,
  textoBusquedaEncargados,
  etiquetaEstado,
  etiquetaAvance,
} from "../utils/asignaciones";

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
 *
 * (p51) La casilla actúa sobre MI asignación, no sobre "el estado de la tarea",
 * que ya no existe como dato único: una tarea con cinco encargados tiene cinco
 * estados. Si la tarea no es mía no hay casilla, y eso NO es un bloqueo que haya
 * que explicar con una alerta —no me corresponde marcarla, igual que no me
 * corresponde la tarea—: en su lugar se lee el avance del conjunto. Cambiar el
 * estado de OTRA persona se hace desde el modal de consulta, que es donde caben
 * los cinco encargados; una fila de tabla no puede mostrar cinco casillas.
 */
function StatusCheckboxCell({ task, onChanged }) {
  const { can } = usePermissions();
  const [ocupado, setOcupado] = useState(false);

  const mia = task.miAsignacion ?? null;
  const avance = etiquetaAvance(task);

  // Sin asignación propia: solo se informa. El avance del conjunto es lo único
  // que esta fila puede decir de una tarea que no es mía.
  if (!mia) {
    return (
      <div className="grid">
        <span className="font-secondary text-medium">{etiquetaEstado(task)}</span>
        {avance && (
          <span className="font-secondary text-caption text-text-muted">{avance}</span>
        )}
      </div>
    );
  }

  const completada = mia.status === "completada";
  const vencida = mia.status === "no_completada";
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
    // (p51) La falta de permiso se avisa con `sinPermiso`, que se cierra sola:
    // los otros dos bloqueos sí son hechos que conviene leer y confirmar, pero
    // aquí el usuario solo necesita saber que no es suyo ese botón.
    Alert.sinPermiso("cambiar el estado de esta tarea");
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
      onClick={bloqueada ? explicarBloqueo : undefined}
      role={bloqueada ? "button" : undefined}
      tabIndex={bloqueada ? 0 : undefined}
      onKeyDown={bloqueada ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); explicarBloqueo(); } } : undefined}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          checked={completada}
          disable={bloqueada || ocupado}
          onChange={cambiar}
          className={bloqueada ? "pointer-events-none" : ""}
        />
        <span className="font-secondary text-medium">
          {/* El estado que se lee aquí es EL MÍO, que es el que la casilla
              cambia. El del conjunto va debajo, para no confundirlos. */}
          {etiquetaEstado({ miAsignacion: mia })}
        </span>
      </div>
      {avance && (
        <span className="font-secondary text-caption text-text-muted">{avance}</span>
      )}
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
    // (p51) El valor que entrega la columna lleva TODOS los nombres y la celda
    // muestra el recuento. Son dos cosas distintas a propósito: si el buscador
    // recibiera "5 personas", buscar a alguien por su nombre no encontraría su
    // tarea, y sería justo el caso nuevo el que quedaría roto.
    accessorFn: (row) => textoBusquedaEncargados(row),
    cell: ({ row }) => (
      <span className="font-secondary text-medium">{etiquetaEncargados(row.original)}</span>
    ),
  },
  {
    id: "endDate",
    header: "Fecha de fin",
    accessorFn: (row) => formatDateOnly(row.endDate),
  },
  {
    id: "estado",
    header: "Estado",
    accessorFn: (row) => etiquetaEstado(row),
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
