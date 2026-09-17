import { z } from "zod";
import {
  camposMaterialCrear,
  camposMaterialEditar,
  validarCantidadVsPlaca,
  validarIngresoVsCompra,
} from "@/shared/schemas/materialSchemaParts";

// Lo propio del devolutivo sobre la tabla padre: categoría, modelo, serial y
// dimensiones.
//
// (p48) modelo y serial pasaron a OPCIONALES. Las dimensiones ya lo eran y su
// obligatoriedad no se puede expresar aquí: depende del NOMBRE de la categoría
// elegida, así que la comprueba el formulario antes de enviar
// (`requiresDimensions` en utils/categoryRules.js).

export const returnableMaterialSchema = z
  .object({
    ...camposMaterialCrear,
    categoryId: z.string().min(1, "Debe seleccionar una categoría"),
    model:      z.string().max(100).optional().or(z.literal("")),
    serial:     z.string().max(20).optional().or(z.literal("")),
    dimensions: z.string().max(100).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    validarCantidadVsPlaca(data, ctx);
    validarIngresoVsCompra(data, ctx);
  });

export const returnableMaterialUpdateSchema = z
  .object({
    ...camposMaterialEditar,
    categoryId: z.string().min(1, "Debe seleccionar una categoría").optional(),
    model:      z.string().max(100).optional().or(z.literal("")),
    serial:     z.string().max(20).optional().or(z.literal("")),
    dimensions: z.string().max(100).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // También al editar: desde p48 el formulario manda placa y cantidad SIEMPRE
    // (vaciarlas es como se quitan), así que aquí ya se conoce el estado final y
    // hay que impedir dejar el material sin ninguna de las dos.
    validarCantidadVsPlaca(data, ctx);
    validarIngresoVsCompra(data, ctx);
  });
