import { z } from "zod";
import {
  camposMaterialCrear,
  camposMaterialEditar,
  validarCantidadVsPlaca,
  validarIngresoVsCompra,
} from "@/shared/schemas/materialSchemaParts";

// El material de consumo no agrega campos propios: es exactamente la tabla
// padre. Lo que lo distingue del devolutivo es que este último tiene DIMENSIONES.
//
// (p53) La categoría, el tipo de material, el modelo y el serial llegan en
// `camposMaterial*` de shared, así que este esquema los hereda sin escribir
// nada: son de la tabla padre y los piden los dos materiales.

export const consumableMaterialSchema = z
  .object(camposMaterialCrear)
  .superRefine((data, ctx) => {
    validarCantidadVsPlaca(data, ctx);
    validarIngresoVsCompra(data, ctx);
  });

export const consumableMaterialUpdateSchema = z
  .object(camposMaterialEditar)
  .superRefine((data, ctx) => {
    // También al editar: desde p48 el formulario manda placa y cantidad SIEMPRE
    // (vaciarlas es como se quitan), así que aquí ya se conoce el estado final y
    // hay que impedir dejar el material sin ninguna de las dos.
    validarCantidadVsPlaca(data, ctx);
    validarIngresoVsCompra(data, ctx);
  });
