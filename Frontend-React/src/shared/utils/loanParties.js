// Quién presta y quién recibe en un préstamo.
//
// (p48) El receptor dejó de ser siempre un usuario del sistema: una firma puede
// llevar `userId: null` + `externalEmail`, y entonces a esa persona se la
// identifica por su correo. Antes cada pantalla resolvía el nombre a su manera y
// con un receptor externo todas pintaban "—".
//
// Vive en shared porque lo usan la tabla, el modal de consulta y el reporte.

/** La firma de una de las dos partes: "Prestador" | "Receptor" */
export const firmaDe = (loan, party) =>
  loan?.signatures?.find((s) => s.party === party) ?? null;

/** Nombre completo de un usuario, o null */
export const nombreDe = (user) =>
  user ? `${user.userFirstName ?? ""} ${user.userLastName ?? ""}`.trim() : null;

/**
 * Cómo se llama esa parte en pantalla: su nombre si está registrada, su correo
 * si es externa, y "—" si la firma no existe.
 */
export const partyLabel = (loan, party) => {
  const sig = firmaDe(loan, party);
  if (!sig) return "—";
  return nombreDe(sig.user) ?? sig.externalEmail ?? "—";
};

/** ¿El receptor es alguien de fuera del sistema? */
export const receptorEsExterno = (loan) => {
  const sig = firmaDe(loan, "Receptor");
  return !!sig && !sig.user;
};

/**
 * Documento de una parte, tal como se muestra bajo su nombre:
 * "Cédula de ciudadanía 1078546789". Null si es externa (no tenemos su
 * documento, solo el correo) o si el dato no vino.
 */
export const documentoDe = (loan, party) => {
  const user = firmaDe(loan, party)?.user;
  if (!user?.userDocumentNumber) return null;
  const tipo = user.documentType?.documentName;
  return tipo ? `${tipo} ${user.userDocumentNumber}` : String(user.userDocumentNumber);
};
