import { z } from "zod";

export const recoverPasswordSchema = z.object({

    userEmail: z.string().email("Debe ingresar un email válido"),

    userEmailConfirm: z.string().email("Debe ingresar un email válido"),

}).refine((data) => data.userEmail === data.userEmailConfirm, {
    message: "Los correos no coinciden",
    path: ["userEmailConfirm"],
});