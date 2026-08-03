import { useState, useEffect } from "react";
import { Button, Input, Select, Alert, Modal } from "@/shared";
import { taskSchema, todayLocalISO } from "../schemas/taskSchema.js";
import taskService from "../services/taskService.js";
import { useUsers } from "@/features/users/hooks/useUsers";

/**
 * Modal reutilizable para crear una tarea.
 *
 * Props:
 * - isOpen / onClose: control del modal (mismo patrón que CreateGroupModal).
 * - onSave: callback tras crear con éxito (ej. refetch de la tabla).
 * - assignedUser: opcional { id, name }. Si viene (ej. desde Visualizar Usuario),
 *   el usuario queda preseleccionado y bloqueado.
 */
export default function CreateTaskModal({ isOpen, onClose, onSave, assignedUser }) {
  const { users } = useUsers();

  const emptyForm = {
    taskName: "",
    description: "",
    endDate: "",
    userId: assignedUser ? String(assignedUser.id) : "",
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
        userId: assignedUser ? String(assignedUser.id) : "",
      });
      setErrors({});
    }
  }, [isOpen, assignedUser]);

  if (!isOpen) return null;

  // El SADMIN ya viene excluido por el backend (systemIdentities.js)
  const userOptions = (users ?? []).map((u) => ({
    id: u.id,
    value: String(u.id),
    label: `${u.userFirstName} ${u.userLastName}`,
  }));

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
        userId: Number(result.data.userId),
        taskName: result.data.taskName,
        description: result.data.description,
        endDate: result.data.endDate,
      });
      setErrors({});
      Alert.success("Tarea creada", "La tarea fue asignada exitosamente.");
      onSave?.();
      onClose?.();
    } catch (error) {
      const msg = error.response?.data?.error ?? "Error al crear la tarea";
      Alert.error("Error al crear la tarea", msg);
      setErrors({ form: msg });
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
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Tarea" size="md">
      <div className="text-neutral-900">
        {/* Vertical hasta md; desde md: 2 columnas × 3 filas (botón incluido) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Input label="Usuario asignado" name="userId" value={assignedUser.name} disabled />
          ) : (
            <Select
              label="Usuario asignado"
              name="userId"
              required
              value={formData.userId}
              onChange={handleChange}
              options={userOptions}
              error={errors.userId}
            />
          )}
          <Input
            label="Descripción de la tarea"
            name="description"
            required
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
          <Input label="Estado" name="status" value="En progreso" disabled />

          <div className="flex items-end justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </div>

        {errors.form && <p className="text-error text-caption mt-4">{errors.form}</p>}
      </div>
    </Modal>
  );
}
