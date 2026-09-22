import { z } from "zod";

// Gemelo de brandSchema e inventorySchema: el backend valida `categoryName`
// string max 100. El mínimo de 3 es una regla del cliente (la misma que en sus
// hermanos) para evitar nombres de un carácter que luego no dicen nada en el
// select de materiales.
export const categorySchema = z.object({

    categoryName: z
        .string()
        .min(3, "El nombre debe tener mínimo 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

    // (p50) Si la categoría exige dimensiones al material devolutivo. Es un dato
    // de la propia categoría: antes la regla se deducía comparando el nombre
    // contra "muebles y enseres", y eso se rompía en cuanto alguien la renombraba.
    requiresDimensions: z.boolean(),

});
