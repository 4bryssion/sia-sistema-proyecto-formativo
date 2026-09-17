/**
 * Valor total de un material: cantidad × valor unitario.
 *
 * Se redondea a 2 decimales porque el producto en coma flotante produce colas
 * (3 × 1.1 → 3.3000000000000003) que el propio validador del formulario rechaza
 * como "Valor inválido", en un campo que el usuario no escribió. Además el
 * backend valida `Joi.number().precision(2)`.
 *
 * Devuelve una cadena porque el formulario trabaja con strings, y `null` cuando
 * no hay con qué calcular, para que el llamador no pise lo ya escrito.
 */
export const calcularTotal = (cantidad, valorUnitario) => {
  // Cantidad vacía ⇒ material serializado (placa SENA) ⇒ cantidad efectiva 1
  const q = cantidad === "" || cantidad === undefined || cantidad === null ? 1 : Number(cantidad);
  const u = Number(valorUnitario);
  if (!(q > 0) || !(u > 0)) return null;
  return String(Math.round(q * u * 100) / 100);
};
