import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { taskSchema } from "../schemas/taskSchema.js";

import { Input, Select, Button, IconButton } from "@/shared";
import { Undo2 } from "lucide-react";

export default function CreateTaskPage() {

    const navigate = useNavigate();

    // Estados:

    const [formData, setFormData] = useState({
        taskTitle: "",
        taskDescription: "",
        taskStartDate: "",
        taskEndDate: "",
        taskStatus: "Pendiente", // Pendiente por defecto
    });

    const [errors, setErrors] = useState({});

    // ===========================================
    //                 Handles
    // ===========================================

    // Handle genérico:
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle personalizado:
    const handleSubmit = (e) => {
        e.preventDefault();

        // Se valida el objeto de formData usando el esquema definido con Zod
        const result = taskSchema.safeParse(formData);

        // Si la validación falla
        if (!result.success) {
            const fieldErrors = {};

            result.error.issues.forEach((issue) => {
                const field = issue.path[0];
                fieldErrors[field] = issue.message;
            });

            setErrors(fieldErrors);
            return;
        }

        // Si la validación es exitosa se limpian los errores anteriores
        setErrors({});

        // result.data contiene los datos ya validados por Zod
        console.log("Tarea válida:", result.data);

        // Aquí normalmente se llamaría a la API para crear la tarea
        // await createTask(result.data);
    };

    return (
        <div className="p-6">

            {/* Encabezado */}
            <div className="flex items-center gap-4 mb-6">
                <IconButton
                    ariaLabel="Devolverse"
                    onClick={() => navigate(-1)}
                >
                    <Undo2 strokeWidth={2.8} />
                </IconButton>

                <h1 className="text-xl font-semibold mb-0 text-h3 sm:text-h2">
                    Crear tarea
                </h1>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex justify-center mt-12 pt-6">
                <div className="grid place-self-center gap-6 mx-6 md:grid-cols-2 md:mx-12 1400:grid-cols-2 1400:mx-0 justify-items-center max-w-max">

                    {/* Columna izquierda */}
                    <div className="flex flex-col gap-6 my-0 w-[320px]">
                        <Input
                            label="Título de la tarea"
                            name="taskTitle"
                            placeholder="Ej: Revisar inventario de marcas"
                            value={formData.taskTitle}
                            onChange={handleChange}
                            error={errors.taskTitle}
                        />

                        <Input
                            label="Descripción de la tarea"
                            name="taskDescription"
                            placeholder="Ej: Verificar que las marcas activas coincidan con el catálogo"
                            value={formData.taskDescription}
                            onChange={handleChange}
                            error={errors.taskDescription}
                        />

                        <Input
                            label="Estado"
                            name="taskStatus"
                            value={formData.taskStatus}
                            disabled
                        />
                    </div>

                    {/* Columna derecha */}
                    <div className="flex flex-col gap-6 my-0 w-[320px]">
                        <Input
                            label="Fecha de inicio"
                            name="taskStartDate"
                            type="date"
                            value={formData.taskStartDate}
                            onChange={handleChange}
                            error={errors.taskStartDate}
                        />

                        <Input
                            label="Fecha de fin"
                            name="taskEndDate"
                            type="date"
                            value={formData.taskEndDate}
                            onChange={handleChange}
                            error={errors.taskEndDate}
                        />

                        {/* Actions */}
                        <div className="flex items-center justify-center mt-4 gap-6">
                            <Button
                                variant="primary"
                                size="sm"
                            >
                                Crear tarea
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}