import { useState, useEffect } from "react";
import { Button, Input, TextArea, Alert, Modal } from "@/shared";
import { taskSchema, todayLocalISO } from "@/shared/schemas/taskSchema";
import taskService from "@/shared/services/taskService";
import { useUsers } from "@/shared/hooks/useUsers";
import AssigneeSelect from "@/shared/components/tasks/AssigneeSelect";

/**
 * Modal reutilizable para crear una tarea.
 *
 * Props:
 * - isOpen / onClose: control del modal (mismo patrón que CreateGroupModal).
 * - onSave: callback tras crear con éxito (ej. refetch de la tabla).
 * - assignedUser: opcional { id, name }. Si viene (ej. desde Visualizar Usuario),
 *   el usuario queda preseleccionado y bloqueado.
 *
 * (p51) Una tarea puede ir a VARIAS personas, cada una con su propio estado, así
 * que el selector de encargado es múltiple con buscador. Desde el perfil de un
 * usuario sigue siendo individual: `assignedUser` fija la lista en esa única
 * persona, y por eso no hace falta un segundo camino para asignar de a uno.
 */
export default function CreateTaskModal({ isOpen, onClose, onSave, assignedUser }) {
  // Solo cuando el modal está abierto: cerrado sigue montado y pediría igual.
  const { users } = useUsers("active", isOpen);

  const emptyForm = {
    taskName: "",
    description: "",
    endDate: "",
    // Lista siempre: con `assignedUser` trae una sola persona.
    userIds: assignedUser ? [String(assignedUser.id)] : [],
  };

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        taskName: "",
        description: "",
        endDate: "",
        userIds: assignedUser ? [String(assignedUser.id)] : [],
      });
      setErrors({});
    }
  }, [isOpen, assignedUser]);

  if (!isOpen) return null;


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const result = taskSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      await taskService.create({
        userIds: result.data.userIds.map(Number),
        taskName: result.data.taskName,
        description: result.data.description,
        endDate: result.data.endDate,
      });
      setErrors({});
      // El texto dice a cuántos: con cinco encargados, "fue asignada" no deja
      // claro si se asignó a todos o solo al primero.
      const cuantos = result.data.userIds.length;
      Alert.success(
        "Tarea creada",
        cuantos === 1
          ? "La tarea fue asignada exitosamente."
          : `La tarea fue asignada a ${cuantos} personas, cada una con su propio estado.`,
      );
      onSave?.();
      onClose?.();
    } catch (error) {
      const msg = error.response?.data?.error ?? "Error al crear la tarea";
      Alert.error("Error al crear la tarea", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    // Migrado al Modal compartido (antes era un overlay propio con z-50 sin
    // portal). Sin portal quedaba dentro del árbol de quien lo abriera, así que
    // al montarse sobre Visualizar Usuario aparecía POR DETRÁS de ese modal:
    // z-index de contextos de apilamiento distintos no compiten entre sí.
    // Ahora ambos son hijos de <body> y el último montado queda encima.
    // (p49) Es un formulario: un clic fuera no puede cerrarlo, o se pierde lo
    // escrito. Y la X va fuera de la tarjeta, en la esquina — regla del proyecto
    // para los modales de formulario.
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Tarea"
      size="md"
      closeOnBackdrop={false}
      closeButtonOutside
    >
      <div className="text-neutral-900">
        {/* Vertical hasta md; desde md: 2 columnas × 3 filas (botón incluido).
            (p53) `items-start`: la descripción pasó a TextArea y es más alta que
            los demás campos. Sin esto, el campo que le toca al lado se estiraría
            a su altura y quedaría un input de 152px de alto. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <Input
            label="Título de la tarea"
            name="taskName"
            required
            placeholder="Ej: Revisar inventario de marcas"
            value={formData.taskName}
            onChange={handleChange}
            error={errors.taskName}
          />
          {assignedUser ? (
            // Desde el perfil de un usuario la asignación es individual y el
            // campo no se toca: es el requisito, y además evita que alguien
            // añada encargados desde una pantalla que habla de una persona.
            <Input label="Usuario asignado" name="userIds" value={assignedUser.name} disabled />
          ) : (
            // (p50) Variante de búsqueda: la lista es TODO el personal activo, y
            // encontrar a alguien por su nombre escribiéndolo es lo que se hace
            // de verdad.
            // (p51) Y múltiple: la misma tarea puede ir a varias personas. El
            // disparador resume "el primero y N más" cuando no caben todos, y
            // los ya marcados salen de primeras en las coincidencias.
            <AssigneeSelect
              label="Encargados"
              required
              users={users}
              value={formData.userIds}
              onChange={handleChange}
              error={errors.userIds}
            />
          )}
          {/* (p53) Era un Input de una línea para un texto de hasta 255
              caracteres: lo pidió el instructor y es el mismo componente que ya
              usa el modal de editar tarea. No se le pasa `widthClass` a
              propósito, para que mida lo mismo que los demás campos del
              formulario; lo único que cambia es la altura. */}
          <TextArea
            label="Descripción de la tarea"
            name="description"
            required
            maxLength={255}
            placeholder="Ej: Verificar que las marcas activas coincidan con el catálogo"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
          />
          <Input
            label="Fecha de fin"
            name="endDate"
            required
            type="date"
            min={todayLocalISO()}
            value={formData.endDate}
            onChange={handleChange}
            error={errors.endDate}
          />
          {/* (p51) El estado es de cada asignación, no de la tarea, y toda
              asignación nace en progreso. El campo se queda como recordatorio de
              eso, en plural cuando hay varios encargados. */}
          <Input
            label="Estado inicial"
            name="status"
            value={formData.userIds.length > 1 ? "En progreso (cada encargado por separado)" : "En progreso"}
            disabled
          />

          <div className="flex items-end justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
