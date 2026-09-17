// Cuentadantes del material (p48): dejaron de ser un userId suelto y pasaron a
// ser filas de material_accountables. El backend los devuelve en `accountables`,
// ordenados por created_at para que "el primero" no cambie entre recargas.

/** Nombre completo de un cuentadante, venga como fila o como usuario suelto */
const nombre = (a) => {
  const u = a?.user ?? a;
  if (!u) return "";
  return `${u.userFirstName ?? ""} ${u.userLastName ?? ""}`.trim();
};

/**
 * Cómo se muestran en una celda o en un par etiqueta/valor: el primero y
 * cuántos más. La lista completa no cabe en una columna de tabla y, repetida en
 * cada fila, tapa el resto de los datos.
 */
export const formatAccountables = (accountables = []) => {
  if (!accountables.length) return "—";
  if (accountables.length === 1) return nombre(accountables[0]);
  return `${nombre(accountables[0])} y ${accountables.length - 1} más`;
};

/** Todos los nombres, uno por línea: para el modal de consulta, donde sí caben */
export const accountableNames = (accountables = []) => accountables.map(nombre);

/** Ids como strings, que es lo que maneja el Select en modo múltiple */
export const accountableIds = (accountables = []) =>
  accountables.map((a) => String(a.userId ?? a.user?.id ?? a.id));
