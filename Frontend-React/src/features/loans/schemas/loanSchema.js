import { z } from "zod";

export const loanSchema = z.object({

    loanMaterial: z
        .string()
        .min(1, "Debe seleccionar al menos un material"),

    loanQuantity: z
        .string()
        .regex(/^\d+$/, "La cantidad debe ser un número entero positivo"),

    loanGroup: z
        .string()
        .regex(/^\d+$/, "El grupo de aprendices debe ser un número válido"),

    loanDepartureDate: z
        .string()
        .min(1, "La fecha de salida es obligatoria")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),

    loanJustification: z
        .string()
        .min(5, "La justificación debe tener mínimo 5 caracteres")
        .max(255, "La justificación no puede superar los 255 caracteres"),

    loanReturnDate: z
        .string()
        .min(1, "La fecha de entrega es obligatoria")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),

    loanRequestingUser: z
        .string()
        .min(1, "Debe seleccionar un usuario solicitante"),

});