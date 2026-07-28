import { z } from "zod";

// Fecha de hoy LOCAL en YYYY-MM-DD ("en-CA" produce ese formato). Se compara como
// string contra el input type="date" para evitar el bug de zona horaria de
// toISOString()/new Date("YYYY-MM-DD"), que parsean en UTC (en UTC-5 rechazaba hoy)
export const todayLocalISO = () => new Date().toLocaleDateString("en-CA");

const materialLineSchema = z.object({
  materialId: z
    .string()
    .min(1, "Seleccione un material"),
  borrowedQuantity: z
    .string()
    .regex(/^\d+$/, "Cantidad inválida")
    .refine((v) => Number(v) > 0, "La cantidad debe ser mayor a 0"),
});

export const loanSchema = z
  .object({
    apprenticeGroup: z
      .string()
      .regex(/^\d+$/, "El grupo de aprendices debe ser numérico"),
    useJustification: z
      .string()
      .min(5, "La justificación debe tener mínimo 5 caracteres")
      .max(255, "La justificación no puede superar los 255 caracteres"),
    returnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)")
      // Hoy es válido; anteriores no (comparación de strings YYYY-MM-DD, segura ante TZ)
      .refine((v) => v >= todayLocalISO(), "La fecha de devolución no puede ser anterior a hoy"),
    lenderId: z.string().min(1, "Seleccione el prestador"),
    receiverId: z.string().min(1, "Seleccione el receptor"),
    materials: z
      .array(materialLineSchema)
      .min(1, "Agregue al menos un material"),
  })
  .refine((d) => d.lenderId !== d.receiverId, {
    message: "El receptor debe ser distinto del prestador",
    path: ["receiverId"],
  });

export const loanUpdateSchema = z
  .object({
    apprenticeGroup: z
      .string()
      .regex(/^\d+$/, "El grupo de aprendices debe ser numérico"),
    useJustification: z
      .string()
      .min(5, "La justificación debe tener mínimo 5 caracteres")
      .max(255, "La justificación no puede superar los 255 caracteres"),
    returnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)")
      // Hoy es válido; anteriores no (comparación de strings YYYY-MM-DD, segura ante TZ)
      .refine((v) => v >= todayLocalISO(), "La fecha de devolución no puede ser anterior a hoy"),
    lenderId: z.string().min(1, "Seleccione el prestador"),
    receiverId: z.string().min(1, "Seleccione el receptor"),
    status: z.enum(["Activo", "Finalizado"]).optional(),
    materials: z.array(materialLineSchema).min(1, "Agregue al menos un material"),
  })
  .refine((d) => d.lenderId !== d.receiverId, {
    message: "El receptor debe ser distinto del prestador",
    path: ["receiverId"],
  });
