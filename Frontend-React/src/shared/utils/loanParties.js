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
 * "Cédula de Ciudadanía 1078546789".
 *
 * (p51) Vale para los dos casos, y a propósito: si está registrada, el documento
 * sale de su ficha de usuario; si es externa, de su propia firma, donde ahora se
 * guarda. Las pantallas no distinguen —piden "el documento del receptor" y lo
 * reciben—, que es justo lo que se pidió: que se refleje igual que el de un
 * usuario registrado.
 *
 * Devuelve null cuando el dato no está, y hay un caso real en el que no está:
 * los préstamos externos creados ANTES de la p51 se guardaron sin documento. En
 * esos la pantalla sigue enseñando el correo, que es lo único que hay.
 */
export const documentoDe = (loan, party) => {
  const sig = firmaDe(loan, party);
  if (!sig) return null;

  const user = sig.user;
  if (user?.userDocumentNumber) {
    const tipo = user.documentType?.documentName;
    return tipo ? `${tipo} ${user.userDocumentNumber}` : String(user.userDocumentNumber);
  }

  if (sig.externalDocumentNumber) {
    const tipo = sig.externalDocumentType?.documentName;
    return tipo
      ? `${tipo} ${sig.externalDocumentNumber}`
      : String(sig.externalDocumentNumber);
  }

  return null;
};
