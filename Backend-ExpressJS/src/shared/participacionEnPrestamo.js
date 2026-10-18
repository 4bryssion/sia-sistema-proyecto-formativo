/**
 * (p51) ¿Quién está involucrado en un préstamo?
 *
 * Las firmas del préstamo lo dicen: hay una por parte (prestador y receptor), y
 * quien aparece en una de ellas es parte del préstamo. No hay otra definición
 * posible, y es la que piden el RFINV11 y el RFINV14 cuando dicen que el
 * invitado ve los préstamos "en los que se encuentre involucrado".
 *
 * Vive en `shared/` porque la necesitan DOS módulos —préstamos y devoluciones—
 * y ninguno de los dos puede depender del otro.
 *
 * El correo entra en la comparación porque el receptor puede no estar
 * registrado: su firma no apunta a ningún usuario y viaja en `externalEmail`.
 * Si alguien registró un préstamo contra el correo de una persona que SÍ tiene
 * cuenta, esa persona está involucrada igual, y mirar solo `userId` la dejaría
 * sin ver su propio préstamo.
 */
export const clausulaParticipacion = ({ id, email }) => ({
  some: {
    OR: [
      { userId: Number(id) },
      // El correo solo entra si lo hay: `{ externalEmail: undefined }` en Prisma
      // no filtra nada, y dejaría pasar TODOS los préstamos.
      ...(email ? [{ externalEmail: String(email).trim().toLowerCase() }] : []),
    ],
  },
});

/** ¿Este préstamo ya cargado tiene al actor entre sus firmas? */
export const participaEnPrestamo = (loan, { id, email }) => {
  const correo = email ? String(email).trim().toLowerCase() : null;
  return (loan?.signatures ?? []).some((f) => (
    Number(f.userId) === Number(id)
    || (correo !== null && f.externalEmail?.trim().toLowerCase() === correo)
  ));
};
