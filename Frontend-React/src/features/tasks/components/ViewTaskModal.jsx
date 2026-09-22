import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Modal, Button, usePermissions } from "@/shared";
// Import directo, como en los modales de ver material: LabelValue no está en el
// índice de shared.
import LabelValue from "@/shared/components/LabelValue";
// endDate es @db.Date (medianoche UTC): `formatDateOnly` lo formatea en UTC, o
// la zona horaria local le restaría un día.
import { formatDate, formatDateOnly } from "@/shared/utils/formatDate";
import taskService from "@/shared/services/taskService";
import { getTaskStatusLabel } from "../constants/taskStatus";

// (p50) Visualizar tarea deja de ser una página (/view/tasks/:id) y pasa a ser
// un modal, como en los módulos principales. Es un modal SIMPLE y no por pasos:
// una tarea son cinco campos, y partirlos en pasos sería trabajo de navegación
// para el usuario sin nada a cambio.
//
// Carga por id y no recibe la fila entera porque también se abre desde sitios
// que solo conocen el id, y así el detalle siempre está recién leído.

export default function ViewTaskModal({ isOpen, taskId, onClose, onEdit }) {
  const { can } = usePermissions();
  // Lo cargado se guarda JUNTO CON el id al que pertenece, en vez de limpiarse
  // al cerrar. Así no hay que tocar el estado cuando el modal se cierra —limpiar
  // en el efecto encadena renders— y, sobre todo, al abrir otra tarea nunca se
  // ve por un instante la anterior: mientras el id no coincida, no hay nada que
  // mostrar.
  const [cargado, setCargado] = useState({ id: null, task: null, error: null });

  useEffect(() => {
    if (!isOpen || taskId == null) return;
    let vigente = true;
    (async () => {
      try {
        const data = await taskService.getById(taskId);
        if (vigente) setCargado({ id: taskId, task: data, error: null });
      } catch (err) {
        if (vigente) {
          setCargado({
            id: taskId,
            task: null,
            error: err.response?.data?.error ?? "Error al cargar la tarea",
          });
        }
      }
    })();
    return () => { vigente = false; };
  }, [isOpen, taskId]);

  const alDia = cargado.id === taskId;
  const task = alDia ? cargado.task : null;
  const error = alDia ? cargado.error : null;

  const encargado = task?.user
    ? `${task.user.userFirstName} ${task.user.userLastName}`
    : "—";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tarea"
      size="md"
      footer={
        <>
          {/* Editar solo para quien gestiona tareas. Quien la tiene asignada la
              cierra desde la casilla del listado, no desde aquí. */}
          {task && can("edit_task") && (
            <Button variant="secondary" size="sm" className="gap-2" onClick={() => onEdit?.(task.id)}>
              <Pencil size={16} />
              Editar
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      {error ? (
        <p className="text-error">{error}</p>
      ) : !task ? (
        <p className="text-gray-600">Cargando tarea...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <LabelValue label="Título de la tarea" value={task.taskName} />
          <LabelValue label="Encargado" value={encargado} />
          <LabelValue label="Estado" value={getTaskStatusLabel(task.status)} />
          <LabelValue label="Registro" value={task.isActive ? "Activa" : "Inactiva"} />
          <LabelValue label="Fecha de inicio" value={formatDate(task.created_at)} />
          <LabelValue label="Fecha de fin" value={formatDateOnly(task.endDate)} />
          <div className="sm:col-span-2">
            <LabelValue label="Descripción" value={task.description} />
          </div>
        </div>
      )}
    </Modal>
  );
}
