import { z } from "zod";

// Fecha de hoy LOCAL en formato YYYY-MM-DD ("en-CA" produce ese formato).
// Se compara como string contra el value del input type="date" para evitar el
// bug de zona horaria: new Date("YYYY-MM-DD") parsea en UTC y en UTC-5 rechazaba
// incluso el día de hoy.
export const todayLocalISO = () => new Date().toLocaleDateString("en-CA");

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
    // Comparación de strings YYYY-MM-DD (segura ante zonas horarias); hoy es válido
    (data) => data.endDate >= todayLocalISO(),
    { message: "La fecha de fin no puede ser anterior a hoy", path: ["endDate"] }
  );
