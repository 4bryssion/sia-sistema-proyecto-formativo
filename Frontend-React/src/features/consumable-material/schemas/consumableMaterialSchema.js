import { z } from "zod";
import {
  camposMaterialCrear,
  camposMaterialEditar,
  validarCantidadVsPlaca,
  validarIngresoVsCompra,
} from "@/shared/schemas/materialSchemaParts";

// El material de consumo no agrega campos propios: es exactamente la tabla
// padre. Lo que lo distingue del devolutivo es lo que este NO tiene
// (categoría, modelo, serial, dimensiones).

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
