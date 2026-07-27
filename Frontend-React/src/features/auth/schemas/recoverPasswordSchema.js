import { z } from "zod";

export const recoverPasswordSchema = z.object({
    userEmail: z.string().email("Debe ingresar un email válido"),
    userCodeRecover: z.string().regex(/^\d{6}$/, "El código debe tener 6 dígitos"),
});