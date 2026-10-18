-- (p51) Documento del receptor NO registrado.
--
-- Un préstamo a alguien de fuera guardaba solo su correo. El correo sirve para
-- mandarle el enlace de firma, pero no identifica a nadie: si el material no
-- vuelve, "pedro@gmail.com" no dice a quién reclamar. Ahora se piden su tipo y
-- su número de documento, y las vistas los muestran igual que los de un usuario
-- registrado.
--
-- Las dos columnas quedan NULL-ables y sin CHECK a propósito, por dos razones:
--   1. La firma del PRESTADOR nunca las lleva: él siempre es un usuario del
--      sistema y su documento está en su ficha.
--   2. Los préstamos externos que ya existen se hicieron sin este dato, y una
--      restricción NOT NULL o un CHECK rechazaría la migración o dejaría la
--      tabla inconsistente. Para los NUEVOS la regla la impone el validador,
--      que es donde ya vive "uno u otro receptor, nunca ambos".
ALTER TABLE "loan_signatures" ADD COLUMN "external_document_type_id" INTEGER;
ALTER TABLE "loan_signatures" ADD COLUMN "external_document_number" VARCHAR(20);

ALTER TABLE "loan_signatures"
  ADD CONSTRAINT "loan_signatures_external_document_type_id_fkey"
  FOREIGN KEY ("external_document_type_id") REFERENCES "document_types"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- El número no es único: la misma persona de fuera puede recibir varios
-- préstamos, y cada firma es un registro distinto. Lo que sí se comprueba en el
-- servicio es que el número no sea el de alguien YA registrado, igual que ya se
-- comprueba con el correo.
CREATE INDEX "loan_signatures_external_document_number_idx"
  ON "loan_signatures" ("external_document_number");
