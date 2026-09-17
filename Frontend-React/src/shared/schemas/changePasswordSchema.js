import { z } from "zod";

// Misma complejidad que exige el backend en POST /api/auth/change-password
// (mayúscula, minúscula, número, especial, 8–72). Aquí solo evita el viaje al
// servidor y señala el campo; la validación que manda es la suya.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Escribe tu contraseña actual"),
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(72, "Máximo 72 caracteres")
      .regex(/[A-Z]/, "Al menos una mayúscula")
      .regex(/[a-z]/, "Al menos una minúscula")
      .regex(/[0-9]/, "Al menos un número")
      .regex(/[^A-Za-z0-9]/, "Al menos un carácter especial"),
    confirmPassword: z.string().min(1, "Repite la nueva contraseña"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
      });
    }
    // El backend también lo rechaza; adelantarlo aquí evita gastar un intento
    // del limitador (10 cada 15 minutos)
    if (data.currentPassword && data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "La nueva contraseña debe ser distinta de la actual",
      });
    }
  });
