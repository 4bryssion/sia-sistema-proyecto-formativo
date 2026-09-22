import { useEffect, useState } from "react";
import { Modal, Button, Input, TextArea, Select, Alert } from "@/shared";
import taskService from "@/shared/services/taskService";
import { TASK_STATUS_LABELS, TASK_STATUS_EDITABLES } from "../constants/taskStatus";

// (p50) Editar tarea deja de ser una página (/view/tasks/:id/edit) y pasa a ser
// un modal SIMPLE, no por pasos: son cuatro campos editables.
//
// Qué NO se puede cambiar aquí, y por qué:
// - El encargado: RFADMIN49 prohíbe reasignar; el backend descarta `userId` en
//   el PUT aunque se mande.
// - El estado a "No completada": lo pone el vencimiento automático. Si la tarea
//   ya venció, el select queda bloqueado y se explica en pantalla, igual que la
//   casilla gris del listado.

// Las dos que una persona puede poner. Se arma desde las etiquetas para no
// mantener una segunda lista.
const OPCIONES_ESTADO = TASK_STATUS_EDITABLES.map((value) => ({
  id: value,
  value,
  label: TASK_STATUS_LABELS[value],
}));

const VACIO = { taskName: "", description: "", endDate: "", status: "en_progreso" };

export default function EditTaskModal({ isOpen, taskId, onClose, onSaved }) {
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
          status: data.status ?? "en_progreso",
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

  const vencida = task?.status === "no_completada";

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardar = async () => {
    const fallos = {};
    if (form.taskName.trim().length < 3) fallos.taskName = "El título debe tener al menos 3 caracteres";
    if (!form.description.trim()) fallos.description = "La descripción es obligatoria";
    if (!form.endDate) fallos.endDate = "La fecha de fin es obligatoria";
    if (Object.keys(fallos).length) { setErrors(fallos); return; }

    setGuardando(true);
    try {
      await taskService.update(task.id, {
        taskName: form.taskName,
        description: form.description,
        endDate: form.endDate,
        // Una tarea vencida conserva su estado: mandarlo sería pedirle al
        // backend un cambio que va a rechazar.
        ...(vencida ? {} : { status: form.status }),
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

  const encargado = task?.user
    ? `${task.user.userFirstName} ${task.user.userLastName}`
    : "—";

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

          {/* El encargado no se edita: RFADMIN49 prohíbe reasignar una tarea */}
          <Input label="Encargado" value={encargado} disabled />

          <Input
            label="Fecha de fin"
            name="endDate"
            type="date"
            required
            value={form.endDate}
            onChange={cambiar}
            error={errors.endDate}
          />

          <Select
            label="Estado"
            name="status"
            value={vencida ? "" : form.status}
            onChange={cambiar}
            options={OPCIONES_ESTADO}
            disabled={vencida}
            placeholder={vencida ? TASK_STATUS_LABELS.no_completada : undefined}
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

          {vencida && (
            <p className="md:col-span-2 font-secondary text-small text-text-muted">
              La tarea venció sin completarse, así que su estado ya no puede cambiarse.
              El resto de los campos sí se puede corregir.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
