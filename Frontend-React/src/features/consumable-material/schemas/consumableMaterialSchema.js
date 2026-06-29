import { z } from "zod";

const consumableMaterialBaseSchema = z.object({
  materialName:  z.string().min(3, "Mínimo 3 caracteres").max(100),
  brandId:       z.string().min(1, "Debe seleccionar una marca"),
  senaPlate:     z.string().max(20).optional().or(z.literal("")),
  location:      z.string().min(2, "Mínimo 2 caracteres").max(100),
  quantity:      z
    .string()
    .regex(/^\d+$/, "Debe ser un número entero")
    .optional()
    .or(z.literal("")),
  status:        z.string().min(1, "Debe seleccionar un estado"),
  unitPrice:     z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),
  totalPrice:    z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),
  purchaseDate:  z
    .string()
    .min(1, "La fecha es obligatoria")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  userId:        z.string().min(1, "Debe seleccionar un cuentadante"),
  description:   z.string().min(5, "Mínimo 5 caracteres").max(255),
});

export const consumableMaterialSchema = consumableMaterialBaseSchema.refine(
  (data) => data.senaPlate || (data.quantity && data.quantity !== ""),
  { message: "La cantidad es obligatoria cuando no hay placa SENA", path: ["quantity"] }
);

export const consumableMaterialUpdateSchema = consumableMaterialBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe modificar al menos un campo",
  });
