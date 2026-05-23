import { z } from "zod";

export const consumableMaterialSchema = z.object({

    consumableName: z
        .string()
        .min(3, "El nombre debe tener mínimo 3 caracteres")
        .max(100, "El nombre es demasiado largo"),

    consumableBrand: z
        .string()
        .min(1, "Debe seleccionar una marca"),

    consumableSenaPlate: z
        .string()
        .min(2, "La placa SENA es inválida")
        .max(40, "La placa SENA es demasiado larga"),

    consumableLocation: z
        .string()
        .min(2, "La ubicación debe tener mínimo 2 caracteres")
        .max(100, "La ubicación es demasiado larga"),

    consumableQuantity: z
        .string()
        .regex(/^\d+$/, "La cantidad debe ser un número entero positivo"),

    consumableState: z
        .string()
        .min(1, "Debe seleccionar un estado"),

    consumableUnitValue: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "El valor unitario debe ser un número válido"),

    consumableTotalValue: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "El valor total debe ser un número válido"),

    consumableDatePurchase: z
        .string()
        .min(1, "La fecha de compra es obligatoria")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),

    consumableAccountant: z
        .string()
        .min(2, "El contador debe tener mínimo 2 caracteres")
        .max(100, "El campo contable es demasiado largo"),

    consumableDescrption: z
        .string()
        .min(5, "La descripción debe tener mínimo 5 caracteres")
        .max(300, "La descripción es demasiado larga"),

});