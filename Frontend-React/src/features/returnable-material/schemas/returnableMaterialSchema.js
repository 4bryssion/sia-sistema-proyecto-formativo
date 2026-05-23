import { z } from "zod";

export const returnableMaterialSchema = z.object({

    returnableCategory: z
        .string()
        .min(1, "Debe seleccionar una categoría"),

    returnableName: z
        .string()
        .min(3, "El nombre debe tener mínimo 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

    returnableBrand: z
        .string()
        .min(1, "Debe seleccionar una marca"),

    returnableModel: z
        .string()
        .min(1, "El modelo debe tener mínimo 1 carácter")
        .max(60, "El modelo es demasiado largo"),

    returnableSerial: z
        .string()
        .min(2, "El serial es inválido")
        .max(60, "El serial es demasiado largo"),

    returnableSenaPlate: z
        .string()
        .min(2, "La placa SENA es inválida")
        .max(40, "La placa SENA es demasiado larga"),

    
    // Este hay que cambiarlo luego, ya que es archivo
    returnableTechnicalSpecifications: z
        .instanceof(File, { message: "Debe subir la ficha técnica" })
        .refine(
            (file) => file.size <= 5 * 1024 * 1024,
            "El archivo no debe superar los 5MB"
        )
        .refine(
            (file) => ["application/pdf", "image/png", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"].includes(file.type),
            "Solo se permiten archivos PDF, PNG o Excel"
        ),

    returnableDimensions: z
        .string()
        .min(1, "Las dimensiones son inválidas")
        .max(100, "Las dimensiones son demasiado largas"),

    returnableAccountant: z
        .string()
        .min(2, "El campo contable debe tener mínimo 2 caracteres")
        .max(100, "El campo contable es demasiado largo"),

    returnableLocation: z
        .string()
        .min(2, "La ubicación debe tener mínimo 2 caracteres")
        .max(100, "La ubicación es demasiado larga"),

    returnableState: z
        .string()
        .min(1, "Debe seleccionar un estado"),

    returnableQuantity: z
        .string()
        .regex(/^\d+$/, "La cantidad debe ser un número entero positivo"),

    returnableUnitValue: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "El valor unitario debe ser un número válido"),

    returnableTotalValue: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "El valor total debe ser un número válido"),

    returnableDescrption: z
        .string()
        .min(5, "La descripción debe tener mínimo 5 caracteres")
        .max(300, "La descripción es demasiado larga"),

});