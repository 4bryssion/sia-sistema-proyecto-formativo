import { z } from "zod";

export const permissionSchema = z.object({

    permissionName: z
        .string()
        .min(3, "El nombre debe tener mínimo 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

});