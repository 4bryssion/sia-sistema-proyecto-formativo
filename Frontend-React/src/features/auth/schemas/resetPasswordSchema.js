import { z } from "zod";

export const resetPasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, "Mínimo 8 caracteres")
            .regex(/[A-Z]/, "Al menos una mayúscula")
            .regex(/[a-z]/, "Al menos una minúscula")
            .regex(/[0-9]/, "Al menos un número")
            .regex(/[^A-Za-z0-9]/, "Al menos un carácter especial"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });
