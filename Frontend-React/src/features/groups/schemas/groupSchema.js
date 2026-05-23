import { z } from "zod";

export const groupSchema = z.object({

    groupName: z
        .string()
        .min(3, "El nombre debe tener mínimo 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

    groupIndividualPermission: z
        .string()
        .min(3, "El nombre/id debe tener mínimo 3 caracteres")
        .max(100, "El nombre/id es demasiado largo"),

});