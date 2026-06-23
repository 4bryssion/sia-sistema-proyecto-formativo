import { z } from "zod";

export const taskSchema = z
  .object({
    taskName: z
      .string()
      .min(3, "El título debe tener al menos 3 caracteres")
      .max(100, "El título es demasiado largo"),
    description: z
      .string()
      .min(1, "La descripción es obligatoria")
      .max(255, "La descripción es demasiado larga"),
    userId: z
      .string()
      .min(1, "Seleccione un usuario asignado"),
    endDate: z
      .string()
      .min(1, "La fecha de fin es obligatoria"),
  })
  .refine(
    (data) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(data.endDate) >= today;
    },
    { message: "La fecha de fin no puede ser anterior a hoy", path: ["endDate"] }
  );
