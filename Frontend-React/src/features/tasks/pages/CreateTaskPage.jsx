import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { taskSchema } from "../schemas/taskSchema.js";
import taskService from "../services/taskService.js";
import { useUsers } from "@/features/users/hooks/useUsers";

import { Input, Select, Button, IconButton } from "@/shared";
import { Undo2 } from "lucide-react";

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const { users } = useUsers();

  const [formData, setFormData] = useState({
    taskName: "",
    description: "",
    endDate: "",
    userId: "",
  });
  const [errors, setErrors] = useState({});

  const userOptions = users.map((u) => ({
    id: u.id,
    value: String(u.id),
    label: `${u.userFirstName} ${u.userLastName}`,
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = taskSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await taskService.create({
        userId: Number(result.data.userId),
        taskName: result.data.taskName,
        description: result.data.description,
        endDate: result.data.endDate,
      });
      setErrors({});
      navigate("/dashboard/tasks");
    } catch (error) {
      setErrors({ form: error.response?.data?.error ?? "Error al crear la tarea" });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
          <Undo2 strokeWidth={2.8} />
        </IconButton>
        <h1 className="text-xl font-semibold mb-0 text-h3 sm:text-h2">Crear tarea</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex justify-center mt-12 pt-6">
        <div className="grid place-self-center gap-6 mx-6 md:grid-cols-2 md:mx-12 1400:grid-cols-2 1400:mx-0 justify-items-center max-w-max">

          {/* Columna izquierda */}
          <div className="flex flex-col gap-6 my-0 w-[320px]">
            <Input
              label="Título de la tarea"
              name="taskName"
              placeholder="Ej: Revisar inventario de marcas"
              value={formData.taskName}
              onChange={handleChange}
              error={errors.taskName}
            />
            <Input
              label="Descripción de la tarea"
              name="description"
              placeholder="Ej: Verificar que las marcas activas coincidan con el catálogo"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
            />
            <Input label="Estado" name="status" value="En progreso" disabled />
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col gap-6 my-0 w-[320px]">
            <Select
              label="Usuario asignado"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              options={userOptions}
              error={errors.userId}
            />
            <Input
              label="Fecha de fin"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              error={errors.endDate}
            />

            {errors.form && <p className="text-error text-caption">{errors.form}</p>}

            <div className="flex items-center justify-center mt-4 gap-6">
              <Button variant="primary" size="sm" type="submit">Crear tarea</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
