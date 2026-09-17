import { z } from "zod";

// Piezas de validación comunes a los DOS tipos de material. Vive en shared por
// la regla de módulos cruzados: material de consumo y devolutivo comparten la
// tabla padre y, desde p48, casi todos los campos.
//
// El backend (Joi) es quien manda; esto solo evita el viaje al servidor y
// señala el campo exacto donde corregir.
//
// (p48) Cambios de contrato que se reflejan aquí:
//   - accountableIds: array, mínimo uno. Sustituye al userId suelto.
//   - inventoryId: obligatorio.
//   - brandId: pasó a opcional.
//   - entryDate: nueva y obligatoria; nunca anterior a la fecha de compra.

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export const fecha = (obligatoria) =>
  obligatoria
    ? z.string().min(1, "La fecha es obligatoria").regex(FORMATO_FECHA, "Formato YYYY-MM-DD")
    : z.string().regex(FORMATO_FECHA, "Formato YYYY-MM-DD").optional().or(z.literal(""));

// El backend (Joi) exige `.positive()`: sin el refine, un 0 pasaba la validación
// del cliente y volvía como 400 en una alerta, en vez de marcar el campo.
const dinero = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Valor inválido")
  .refine((v) => Number(v) > 0, "Debe ser mayor que cero");

// La fecha de ingreso no puede ser anterior a la de compra: el material no puede
// entrar al almacén antes de existir. Se comparan como TEXTO YYYY-MM-DD, que
// ordena igual que la fecha y no arrastra el desfase de zona horaria de
// `new Date("YYYY-MM-DD")`, que el navegador interpreta como UTC.
export const validarIngresoVsCompra = (data, ctx) => {
  if (data.purchaseDate && data.entryDate && data.entryDate < data.purchaseDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["entryDate"],
      message: "La fecha de ingreso no puede ser anterior a la de compra",
    });
  }
};

// Sin placa SENA hace falta cantidad. Con placa el material es serializado y su
// cantidad viaja como null (misma semántica que préstamos y devoluciones).
export const validarCantidadVsPlaca = (data, ctx) => {
  if (!data.senaPlate && (!data.quantity || data.quantity === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["quantity"],
      message: "La cantidad es obligatoria cuando no hay placa SENA",
    });
  }
};

/** Campos que comparten los dos tipos de material, en su versión de CREAR */
export const camposMaterialCrear = {
  materialName:   z.string().min(3, "Mínimo 3 caracteres").max(100),
  // (p48) La marca dejó de ser obligatoria
  brandId:        z.string().optional().or(z.literal("")),
  // (p48) El inventario SÍ lo es
  inventoryId:    z.string().min(1, "Debe seleccionar un inventario"),
  // (p48) Uno o varios cuentadantes
  accountableIds: z.array(z.string()).min(1, "Debe seleccionar al menos un cuentadante"),
  senaPlate:      z.string().max(20).optional().or(z.literal("")),
  location:       z.string().min(2, "Mínimo 2 caracteres").max(100),
  quantity:       z.string().regex(/^\d+$/, "Debe ser un número entero").optional().or(z.literal("")),
  status:         z.string().min(1, "Debe seleccionar un estado"),
  unitPrice:      dinero,
  totalPrice:     dinero,
  purchaseDate:   fecha(true),
  entryDate:      fecha(true),
  description:    z.string().min(5, "Mínimo 5 caracteres").max(255),
};

/** Los mismos campos en su versión de EDITAR: todos opcionales */
export const camposMaterialEditar = {
  materialName:   z.string().min(3, "Mínimo 3 caracteres").max(100).optional(),
  brandId:        z.string().optional().or(z.literal("")),
  inventoryId:    z.string().min(1, "Debe seleccionar un inventario").optional(),
  accountableIds: z.array(z.string()).min(1, "Debe seleccionar al menos un cuentadante").optional(),
  senaPlate:      z.string().max(20).optional().or(z.literal("")),
  location:       z.string().min(2, "Mínimo 2 caracteres").max(100).optional(),
  quantity:       z.string().regex(/^\d+$/, "Debe ser un número entero").optional().or(z.literal("")),
  status:         z.string().min(1, "Debe seleccionar un estado").optional(),
  unitPrice:      dinero.optional(),
  totalPrice:     dinero.optional(),
  purchaseDate:   fecha(false),
  entryDate:      fecha(false),
  description:    z.string().min(5, "Mínimo 5 caracteres").max(255).optional(),
};
