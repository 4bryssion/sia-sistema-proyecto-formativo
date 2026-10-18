import { useEffect, useState } from "react";
import { Modal, Button, Input, TextArea, Alert } from "@/shared";
import taskService from "@/shared/services/taskService";
import { etiquetaEstado, etiquetaAvance } from "../utils/asignaciones";
import { todayLocalISO } from "@/shared/schemas/taskSchema";
import { useUsers } from "@/shared/hooks/useUsers";
import AssigneeSelect from "@/shared/components/tasks/AssigneeSelect";

// (p50) Editar tarea deja de ser una página (/view/tasks/:id/edit) y pasa a ser
// un modal SIMPLE, no por pasos: son cuatro campos editables.
//
// (p51) Los ENCARGADOS sí se editan aquí, con el mismo select y los mismos
// filtros que al crear: si al asignar se te quedó alguien fuera o entró quien no
// era, corregirlo tiene que ser tan fácil como haberlo hecho mal.
//
// Antes no se podía, y el motivo documentado era el «RFADMIN49», que NO EXISTE:
// los requerimientos de ADMIN del documento llegan al 45 y no hay ninguno sobre
// tareas. La restricción se la inventó alguien y el backend la hacía cumplir.
//
// Qué NO se puede cambiar aquí, y por qué:
// - El estado: (p51) dejó de estar aquí. Una tarea puede tener varios
//   encargados y cada uno lleva el suyo, así que un único select de estado ya
//   no representa nada. Se cambia desde el modal de consulta, encargado por
//   encargado, con la ruta que sabe de quién es el estado que se toca.
//
//   Y era un defecto, no solo un sobrante: este modal enviaba `status` en el
//   PUT, el validador del backend ya no lo acepta y Joi rechaza las claves que
//   no conoce. Guardar cualquier edición devolvía 400.


const VACIO = { taskName: "", description: "", endDate: "", userIds: [] };

export default function EditTaskModal({ isOpen, taskId, onClose, onSaved }) {
  const { users } = useUsers("active", isOpen);
  const [task, setTask] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [errors, setErrors] = useState({});
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || taskId == null) return;
    let vigente = true;
    setCargando(true);
    (async () => {
      try {
        const data = await taskService.getById(taskId);
        if (!vigente) return;
        setTask(data);
        setForm({
          taskName: data.taskName ?? "",
          description: data.description ?? "",
          // endDate viene como fecha ISO; el input type="date" quiere YYYY-MM-DD
          endDate: data.endDate ? String(data.endDate).slice(0, 10) : "",
          userIds: (data.assignments ?? []).map((x) => String(x.userId)),
        });
        setErrors({});
        setError(null);
      } catch (err) {
        if (vigente) setError(err.response?.data?.error ?? "Error al cargar la tarea");
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => { vigente = false; };
  }, [isOpen, taskId]);


  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Cuántos encargados cerraron por vencimiento. No se puede deducir de un
  // único campo: el vencimiento se aplica asignación por asignación.
  const vencidas = (task?.assignments ?? []).filter((x) => x.status === "no_completada").length;

  // (p52) La fecha de fin que trae la tarea. Hace falta para distinguir «no la
  // toco» de «la cambio»: una tarea vieja puede tener la fecha ya pasada, y
  // rechazarla al editar el titulo dejaria la tarea imposible de corregir.
  const fechaOriginal = task?.endDate ? String(task.endDate).slice(0, 10) : "";

  const guardar = async () => {
    const fallos = {};
    if (form.taskName.trim().length < 3) fallos.taskName = "El título debe tener al menos 3 caracteres";
    if (!form.description.trim()) fallos.description = "La descripción es obligatoria";
    if (!form.endDate) fallos.endDate = "La fecha de fin es obligatoria";
    // (p52) Faltaba, y crear si lo tenia: se podia poner la fecha de ayer y
    // guardar sin queja. La tarea nacia vencida —la rutina diaria marca las
    // asignaciones como no completadas— y la casilla quedaba bloqueada para
    // siempre, sin forma de deshacerlo desde la interfaz.
    else if (form.endDate !== fechaOriginal && form.endDate < todayLocalISO()) {
      fallos.endDate = "La fecha de fin no puede ser anterior a hoy";
    }
    if (form.userIds.length === 0) fallos.userIds = "La tarea necesita al menos un encargado";
    if (Object.keys(fallos).length) { setErrors(fallos); return; }

    // (p51) Quitar a alguien borra su asignación, y con ella su estado. Si ya
    // había terminado, eso es perder la constancia de un trabajo hecho: se
    // pregunta antes, nombrando a quién. No se bloquea, porque el caso de haber
    // asignado a la persona equivocada también es real.
    const salen = (task.assignments ?? []).filter((a) => !form.userIds.includes(String(a.userId)));
    const completados = salen.filter((a) => a.status === "completada");
    if (completados.length) {
      const nombres = completados
        .map((a) => (a.user ? `${a.user.userFirstName} ${a.user.userLastName}` : "un encargado"))
        .join(", ");
      const r = await Alert.warning(
        completados.length === 1 ? "Ya completó la tarea" : "Ya completaron la tarea",
        `${nombres} ${completados.length === 1 ? "ya la había completado" : "ya la habían completado"}. `
        + "Al quitarla de sus encargados se perderá ese registro.",
      );
      if (!r.isConfirmed) return;
    }

    setGuardando(true);
    try {
      await taskService.update(task.id, {
        taskName: form.taskName,
        description: form.description,
        endDate: form.endDate,
        userIds: form.userIds.map(Number),
      });
      setErrors({});
      Alert.success("Tarea actualizada");
      onSaved?.();
      onClose?.();
    } catch (err) {
      Alert.error(
        "Error al actualizar la tarea",
        err.response?.data?.error ?? "Inténtalo de nuevo en unos momentos.",
      );
    } finally {
      setGuardando(false);
    }
  };



  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar tarea"
      size="md"
      // Formulario: un clic fuera no puede cerrarlo, y la X va fuera de la
      // tarjeta. Regla del proyecto para los modales de formulario.
      closeOnBackdrop={false}
      closeButtonOutside
      footer={
        <>
          <Button variant="secondary" size="sm" className="mr-3" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={guardar} disabled={guardando || cargando || !task}>
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </>
      }
    >
      {error ? (
        <p className="text-error">{error}</p>
      ) : cargando || !task ? (
        <p className="text-gray-600">Cargando tarea...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Título de la tarea"
            name="taskName"
            required
            value={form.taskName}
            onChange={cambiar}
            error={errors.taskName}
          />

          {/* El mismo control que al crear, con los mismos filtros: por grupo y
              por vínculo vigente, y con «marcar los que coinciden». */}
          <AssigneeSelect
            label="Encargados"
            required
            users={users}
            value={form.userIds}
            onChange={cambiar}
            error={errors.userIds}
          />

          <Input
            label="Fecha de fin"
            name="endDate"
            type="date"
            min={todayLocalISO()}
            required
            value={form.endDate}
            onChange={cambiar}
            error={errors.endDate}
          />

          {/* Solo informativo: el estado se cambia por encargado, en el modal
              de consulta. Un campo deshabilitado aquí comunica "esto se podría
              editar y no puedes", y no es el caso: no se edita desde ningún
              formulario, se cambia marcando la casilla de cada persona. */}
          <Input
            label="Estado de la tarea"
            value={[etiquetaEstado(task), etiquetaAvance(task)].filter(Boolean).join(" · ")}
            disabled
          />

          <div className="md:col-span-2">
            <TextArea
              label="Descripción de la tarea"
              name="description"
              required
              value={form.description}
              onChange={cambiar}
              error={errors.description}
              className="md:max-w-full"
            />
          </div>

          {/* (p51) Dónde se cambia el estado, porque ya no es aquí. Y si a
              alguien se le pasó la fecha, se dice: ese estado lo puso el
              vencimiento automático y no se revierte. */}
          <p className="md:col-span-2 font-secondary text-small text-text-muted">
            El estado es de cada encargado: se cambia desde la consulta de la tarea,
            marcando la casilla de la persona.
            {vencidas > 0 && (
              vencidas === 1
                ? " A un encargado se le pasó la fecha límite y su estado ya no puede cambiarse."
                : ` A ${vencidas} encargados se les pasó la fecha límite y sus estados ya no pueden cambiarse.`
            )}
          </p>
        </div>
      )}
    </Modal>
  );
}
