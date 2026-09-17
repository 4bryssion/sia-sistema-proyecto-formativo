import { z } from "zod";

export const brandSchema = z.object({

    brandName: z
        .string()
        .min(3, "El nombre debe tener mínimo 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

});