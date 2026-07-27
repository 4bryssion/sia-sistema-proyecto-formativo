import { z } from "zod";

// Una línea de retorno: ramifica por tipo de material (igual criterio que el backend,
// quantity == null ⇒ serializado con placa SENA).
export const loanReturnLineSchema = z
  .object({
    materialId: z.union([z.string(), z.number()]),
    isQuantityType: z.boolean(),
    borrowedQuantity: z.number(),
    remainingQuantity: z.string().optional().or(z.literal("")),
    materialStatus: z.string().optional().or(z.literal("")),
    observations: z.string().max(255, "Máximo 255 caracteres").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.isQuantityType) {
      if (!data.remainingQuantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["remainingQuantity"],
          message: "La cantidad sobrante es obligatoria",
        });
        return;
      }
      if (!/^\d+$/.test(data.remainingQuantity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["remainingQuantity"],
          message: "Cantidad inválida",
        });
        return;
      }
      const n = Number(data.remainingQuantity);
      if (n > data.borrowedQuantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["remainingQuantity"],
          message: `La cantidad sobrante no puede superar la cantidad prestada (${data.borrowedQuantity}).`,
        });
      }
    } else if (!data.materialStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["materialStatus"],
        message: "Debe indicar el estado final del material devuelto.",
      });
    }
  });
