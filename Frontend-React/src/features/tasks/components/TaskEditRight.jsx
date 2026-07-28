import { useState, useEffect } from "react";
import { Input, Select, Button, Alert } from "@/shared";
import { Save } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import { useNavigate } from "react-router-dom";
import taskService from "../services/taskService";

const STATUS_OPTIONS = [
  { id: "en_progreso", value: "en_progreso", label: "En progreso" },
  { id: "completada", value: "completada", label: "Completada" },
  { id: "no_completada", value: "no_completada", label: "No completada" },
];

export default function TaskEditRight({ task }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    taskName: "",
    description: "",
    endDate: "",
    status: "en_progreso",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        taskName: task.taskName ?? "",
        description: task.description ?? "",
        endDate: task.endDate ? task.endDate.slice(0, 10) : "",
        status: task.status ?? "en_progreso",
      });
    }
  }, [task]);

  const assignee = task?.user
    ? `${task.user.userFirstName} ${task.user.userLastName}`
    : "—";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const fieldErrors = {};
    if (form.taskName.trim().length < 3) fieldErrors.taskName = "El título debe tener al menos 3 caracteres";
    if (!form.description.trim()) fieldErrors.description = "La descripción es obligatoria";
    if (!form.endDate) fieldErrors.endDate = "La fecha de fin es obligatoria";
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }

    setSaving(true);
    try {
      await taskService.update(task.id, {
        taskName: form.taskName,
        description: form.description,
        endDate: form.endDate,
        status: form.status,
      });
      setErrors({});
      Alert.success("Tarea actualizada");
      navigate(`/view/tasks/${task.id}`);
    } catch (err) {
      const msg = err.response?.data?.error ?? "Error al actualizar la tarea";
      Alert.error("Error al actualizar la tarea", msg);
      setErrors({ form: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Tarea
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-6 justify-items-center">
          <Input
            label="Título de la tarea"
            name="taskName"
            value={form.taskName}
            onChange={handleChange}
            error={errors.taskName}
          />
          <Input
            label="Descripción de la tarea"
            name="description"
            value={form.description}
            onChange={handleChange}
            error={errors.description}
          />
          <Select
            label="Estado"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={STATUS_OPTIONS}
          />
        </div>

        <div className="grid gap-6 justify-items-center lg:h-max">
          <Input label="Usuario asignado" value={assignee} disabled />
          <Input
            label="Fecha de inicio"
            value={task?.created_at ? new Date(task.created_at).toLocaleDateString("es-CO") : ""}
            disabled
          />
          <Input
            label="Fecha de fin"
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleChange}
            error={errors.endDate}
          />
        </div>
      </div>

      {errors.form && <p className="text-error text-caption mt-4">{errors.form}</p>}

      <div className="grid gap-6 mt-6 sm:flex sm:w-80 sm:mx-auto sm:justify-end lg:flex lg:w-full">
        <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          onClick={handleSubmit}
          disabled={saving}
        >
          <Save size={16} />
          Guardar
        </Button>
      </div>

      <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
    </div>
  );
}
