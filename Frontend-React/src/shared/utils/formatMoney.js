// Precios en pesos colombianos con separador de miles. Estaba definido igual en
// los dos modales de consulta de material.
export const money = (v) =>
  v == null || v === "" ? "—" : `$ ${Number(v).toLocaleString("es-CO")}`;
