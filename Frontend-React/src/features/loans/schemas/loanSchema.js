import { z } from "zod";
import { isoLocal } from "@/shared/utils/formatDate";

// Fecha de hoy LOCAL en YYYY-MM-DD ("en-CA" produce ese formato). Se compara como
// string contra el input type="date" para evitar el bug de zona horaria de
// toISOString()/new Date("YYYY-MM-DD"), que parsean en UTC (en UTC-5 rechazaba hoy)
// (p50) Una sola implementación, en shared/utils/formatDate.js. Estaba
// escrita igual en este archivo, en taskSchema y en userSchema. Se conserva
// el nombre para no tocar los ocho sitios que ya la importan de aquí.
export const todayLocalISO = isoLocal;

// (p48) Naturaleza del préstamo. Es INDEPENDIENTE de si el receptor está
// registrado: un usuario del sistema puede llevarse material a una actividad
// externa, y alguien de fuera puede recibirlo dentro del centro.
export const LOAN_TYPE_OPTIONS = [
  { value: "Interno", label: "Interno" },
  { value: "Externo", label: "Externo" },
];

const materialLineSchema = z.object({
  materialId: z
    .string()
    .min(1, "Seleccione un material"),
  borrowedQuantity: z
    .string()
    .regex(/^\d+$/, "Cantidad inválida")
    .refine((v) => Number(v) > 0, "La cantidad debe ser mayor a 0"),
});

// Campos comunes a crear y editar
const camposLoan = {
  // (p48) Opcional: no todo préstamo se hace para un grupo de aprendices.
  // Vacío viaja como null, nunca como 0.
  // Sin unión (`.or(z.literal(""))`) a propósito: con ella Zod emitía un
  // "invalid_union" genérico y el mensaje del regex no llegaba nunca al campo.
  // El `0` se rechaza porque el backend exige `.positive()`; antes pasaba la
  // validación del cliente y volvía como un 400 en inglés.
  apprenticeGroup: z
    .string()
    .refine((v) => v === "" || /^\d+$/.test(v), "El grupo de aprendices debe ser numérico")
    .refine((v) => v === "" || Number(v) > 0, "El grupo de aprendices debe ser mayor que cero"),
  loanType: z.enum(["Interno", "Externo"], {
    message: "Seleccione el tipo de préstamo",
  }),
  useJustification: z
    .string()
    .min(5, "La justificación debe tener mínimo 5 caracteres")
    .max(255, "La justificación no puede superar los 255 caracteres"),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)")
    // Hoy es válido; anteriores no (comparación de strings YYYY-MM-DD, segura ante TZ)
    .refine((v) => v >= todayLocalISO(), "La fecha de devolución no puede ser anterior a hoy"),
  lenderId: z.string().min(1, "Seleccione el prestador"),

  // (p48) El receptor es UNA de dos cosas, nunca las dos:
  //   receiverRegistered = true  → receiverId (un usuario del sistema)
  //   receiverRegistered = false → receiverEmail (alguien que NO está registrado)
  // El backend lo expresa con un `xor`; aquí la casilla decide cuál de los dos
  // campos se exige, y el formulario envía solo ese.
  receiverRegistered: z.boolean(),
  receiverId: z.string().optional().or(z.literal("")),
  receiverEmail: z.string().optional().or(z.literal("")),

  materials: z
    .array(materialLineSchema)
    .min(1, "Agregue al menos un material"),
};

const validarReceptor = (d, ctx) => {
  if (d.receiverRegistered) {
    if (!d.receiverId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["receiverId"],
        message: "Seleccione el receptor",
      });
    } else if (d.receiverId === d.lenderId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["receiverId"],
        message: "El receptor debe ser distinto del prestador",
      });
    }
    return;
  }

  if (!d.receiverEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["receiverEmail"],
      message: "Escriba el correo del receptor",
    });
    return;
  }
  if (!z.string().email().safeParse(d.receiverEmail).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["receiverEmail"],
      message: "Correo electrónico inválido",
    });
  }
};

export const loanSchema = z.object(camposLoan).superRefine(validarReceptor);

export const loanUpdateSchema = z
  .object({
    ...camposLoan,
    status: z.enum(["Activo", "Finalizado"]).optional(),
  })
  .superRefine(validarReceptor);
