// frontend/src/features/tasks/schemas/taskSchema.js

import { z } from "zod";

export const taskSchema = z
    .object({
        taskTitle: z
            .string()
            .min(3, "El título debe tener al menos 3 caracteres")
            .nonempty("El título es obligatorio"),

        taskDescription: z
            .string()
            .nonempty("La descripción es obligatoria"),

        taskStartDate: z
            .string()
            .nonempty("La fecha de inicio es obligatoria"),

        taskEndDate: z
            .string()
            .nonempty("La fecha de fin es obligatoria"),

    })
    // Validación cruzada: la fecha de fin debe ser posterior a la de inicio
    .refine(
        (data) => {
            if (!data.taskStartDate || !data.taskEndDate) return true;
            return new Date(data.taskEndDate) > new Date(data.taskStartDate);
        },
        {
            message: "La fecha de fin debe ser posterior a la fecha de inicio",
            path: ["taskEndDate"], // El error se asocia al campo taskEndDate
        }
    );