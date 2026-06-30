import { z } from "zod";

export const returnableMaterialSchema = z.object({
  materialName: z.string().min(3, "Mínimo 3 caracteres").max(100),
  brandId:      z.string().min(1, "Debe seleccionar una marca"),
  categoryId:   z.string().min(1, "Debe seleccionar una categoría"),
  userId:       z.string().min(1, "Debe seleccionar un cuentadante"),
  senaPlate:    z.string().max(20).optional().or(z.literal("")),
  quantity:     z.string().regex(/^\d+$/, "Debe ser un número entero positivo").optional().or(z.literal("")),
  location:     z.string().min(2, "Mínimo 2 caracteres").max(100),
  status:       z.string().min(1, "Debe seleccionar un estado"),
  unitPrice:    z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),
  totalPrice:   z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),
  purchaseDate: z.string().min(1, "La fecha es obligatoria").regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  description:  z.string().min(5, "Mínimo 5 caracteres").max(255),
  model:        z.string().min(1, "Mínimo 1 carácter").max(100),
  serial:       z.string().min(2, "Mínimo 2 caracteres").max(20),
  dimensions:   z.string().max(100).optional().or(z.literal("")),
})
.superRefine((data, ctx) => {
  if (!data.senaPlate && (!data.quantity || data.quantity === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["quantity"],
      message: "Cantidad es obligatoria cuando no hay Placa SENA",
    });
  }
});

export const returnableMaterialUpdateSchema = z.object({
  materialName: z.string().min(3).max(100).optional(),
  brandId:      z.string().min(1).optional(),
  categoryId:   z.string().min(1).optional(),
  userId:       z.string().min(1).optional(),
  senaPlate:    z.string().max(20).optional().or(z.literal("")),
  quantity:     z.string().regex(/^\d+$/).optional().or(z.literal("")),
  location:     z.string().min(2).max(100).optional(),
  status:       z.string().min(1).optional(),
  unitPrice:    z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  totalPrice:   z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description:  z.string().min(5).max(255).optional(),
  model:        z.string().min(1).max(100).optional(),
  serial:       z.string().min(2).max(20).optional(),
  dimensions:   z.string().max(100).optional().or(z.literal("")),
}).refine(
  (data) => Object.keys(data).some((k) => data[k] !== undefined && data[k] !== ""),
  { message: "Debe modificar al menos un campo" }
);
