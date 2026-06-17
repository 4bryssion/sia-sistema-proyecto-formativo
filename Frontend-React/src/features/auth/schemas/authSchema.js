import { z } from "zod";

export const authSchema = z.object({

    userEmail: z.email("Debe ingresar un email válido"),

    userPassword: z.string().min(2, "La contraseña es obligatoria")
   
});