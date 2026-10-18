import { z } from "zod";
import {
  camposMaterialCrear,
  camposMaterialEditar,
  validarCantidadVsPlaca,
  validarIngresoVsCompra,
} from "@/shared/schemas/materialSchemaParts";

// (p53) Lo único propio del devolutivo son las DIMENSIONES. La categoría, el
// modelo y el serial se mudaron a la tabla padre —los pide también el material
// de consumo— y por eso ahora viven en `camposMaterial*` de shared.
//
// La obligatoriedad de las dimensiones no se puede expresar aquí: depende de si
// el TIPO de material elegido la pide (`requiresDimensions`, una columna de la
// fila), así que la comprueba el formulario antes de enviar
// (`shared/utils/materialClassification.js`).

export const returnableMaterialSchema = z
  .object({
    ...camposMaterialCrear,
    dimensions: z.string().max(100).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    validarCantidadVsPlaca(data, ctx);
    validarIngresoVsCompra(data, ctx);
  });

export const returnableMaterialUpdateSchema = z
  .object({
    ...camposMaterialEditar,
    dimensions: z.string().max(100).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // También al editar: desde p48 el formulario manda placa y cantidad SIEMPRE
    // (vaciarlas es como se quitan), así que aquí ya se conoce el estado final y
    // hay que impedir dejar el material sin ninguna de las dos.
    validarCantidadVsPlaca(data, ctx);
    validarIngresoVsCompra(data, ctx);
  });
