import { z } from "zod";

// El flujo de recuperación quedó separado en tres vistas (jul-2026), así que cada
// paso valida SOLO lo suyo. Antes un único schema exigía correo + código a la vez,
// lo que ya no aplica: en el paso 1 el código todavía no existe.

// Paso 1 — solicitar el código
export const recoverEmailSchema = z.object({
    userEmail: z.string().email("Debe ingresar un email válido"),
});

// Paso 2 — verificar el código (el correo viaja por router state, no se re-digita)
export const recoverCodeSchema = z.object({
    userCodeRecover: z.string().regex(/^\d{6}$/, "El código debe tener 6 dígitos"),
});

// Forma completa que espera authService.verifyResetCode ({ userEmail, userCodeRecover })
export const recoverPasswordSchema = recoverEmailSchema.extend(recoverCodeSchema.shape);
