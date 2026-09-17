import { z } from "zod";

// Gemelo de brandSchema: el backend valida `inventoryName` string max 100.
// El mínimo de 3 es una regla del cliente (misma que marcas) para evitar
// nombres de un carácter que luego no dicen nada en el select de materiales.
export const inventorySchema = z.object({

    inventoryName: z
        .string()
        .min(3, "El nombre debe tener mínimo 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

});
