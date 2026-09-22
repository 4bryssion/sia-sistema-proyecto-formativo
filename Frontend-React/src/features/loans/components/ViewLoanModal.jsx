// Visualizar préstamo — modal (reemplaza a /view/loans/:id).
//
// Misma estructura y segmentación que los modales de consulta de usuarios y
// materiales: columna de identidad a la izquierda (foto del receptor, nombre y
// estado) y bloques de label + texto a la derecha. La información NO va en
// inputs deshabilitados. Sin logo del SENA.

import { useEffect, useState } from "react";
import { Modal, Button, ImageZoom, usePermissions } from "@/shared";
import { Pencil } from "lucide-react";
import loanService from "@/shared/services/loanService";
import { getLoanStatusLabel, getLoanTypeLabel } from "../utils/loanStatusLabel";
import { partyLabel, documentoDe, firmaDe, nombreDe } from "@/shared/utils/loanParties";
import UserPhoto from "@/shared/components/users/UserPhoto";
import { getMaterialTypeLabel } from "@/shared/utils/devolutionLabels";
import { formatDateOnly, formatAuditDate } from "@/shared/utils/formatDate";

function Field({ label, value, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="font-secondary text-small text-text-muted">{label}</p>
      <p className="font-secondary text-body wrap-break-word">{value || "—"}</p>
    </div>
  );
}

export default function ViewLoanModal({ isOpen, loanId, onClose, onEdit }) {
  const { can } = usePermissions();

  const [loan, setLoan] = useState(null);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!isOpen || !loanId) return;
    (async () => {
      setError(null);
      // El visor de foto ampliada no se reinicia solo: este modal se mantiene
      // montado y al abrir otro préstamo conservaba el zoom del anterior
      setZoom(false);
      try { setLoan(await loanService.getById(loanId)); }
      catch (err) { setError(err.response?.data?.error ?? "Error al cargar el préstamo"); }
    })();
  }, [isOpen, loanId]);

  // Puede quedar en memoria el préstamo de la apertura anterior
  const loaded = loan && String(loan.id) === String(loanId);

  // Con la foto ampliada, Escape cierra SOLO el visor (capture:true evita que el
  // listener del Modal se dispare también)
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setZoom(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [zoom]);

  const firma = (party) => firmaDe(loan, party);
  const receptor = firma("Receptor")?.user;
  // (p48) El receptor puede no estar registrado: su firma lleva userId null y
  // externalEmail, y entonces el correo es lo único que lo identifica
  const receptorLabel = loaded ? partyLabel(loan, "Receptor") : "";
  const receptorDocumento = loaded ? documentoDe(loan, "Receptor") : null;
  const receptorEmailExterno = loaded ? firma("Receptor")?.externalEmail ?? null : null;
  const puedeEditar = loaded && loan.status === "Activo";

  const lineaFirma = (party) => {
    const sig = firma(party);
    if (!sig) return null;
    // Un firmante externo no tiene nombre: se le identifica por el correo al que
    // se le mandó el enlace
    const quien = nombreDe(sig.user) ?? sig.externalEmail;
    if (!quien) return null;
    return `${quien} — ${sig.signed ? `firmó el ${formatAuditDate(sig.signedAt)}` : "sin firmar"}`;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Préstamo"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            {can("update_loan") && loaded && (
              <Button
                variant="primary"
                size="sm"
                className="gap-2"
                disabled={!puedeEditar}
                // El guard vive también en la fila de la tabla; aquí se refuerza
                // deshabilitando en vez de dejar pulsar y fallar después
                title={puedeEditar ? "Editar préstamo" : "Solo los préstamos en estado Activo pueden editarse"}
                onClick={() => puedeEditar && onEdit?.(loan.id)}
              >
                <Pencil size={16} />
                Editar
              </Button>
            )}
          </>
        }
      >
        {error ? (
          <p className="text-error font-secondary">{error}</p>
        ) : !loaded ? (
          <p className="text-text-muted font-secondary">Cargando préstamo...</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">

            {/* Columna de identidad: el préstamo se reconoce por quién lo recibe */}
            <div className="flex flex-col items-center gap-3 lg:border-r lg:border-border lg:pr-6">
              <button
                type="button"
                onClick={() => receptor?.userPhoto && setZoom(true)}
                aria-label="Ampliar foto"
                disabled={!receptor?.userPhoto}
                className="rounded-xl overflow-hidden border border-border cursor-zoom-in hover:opacity-90 transition-opacity disabled:cursor-default"
              >
                <UserPhoto
                  photo={receptor?.userPhoto}
                  alt={receptorLabel}
                  rounded=""
                />
              </button>

              <h3 className="font-main text-h3 font-bold text-center leading-tight wrap-break-word">
                {receptorLabel}
              </h3>

              {/* (p48) Bajo el nombre, cómo identificarlo: su documento si está
                  registrado, su correo si viene de fuera. Es lo que hace falta
                  para entregarle el material en mano. */}
              {receptorDocumento ? (
                <p className="font-secondary text-small text-text-muted text-center">
                  {receptorDocumento}
                </p>
              ) : receptorEmailExterno ? (
                <p className="font-secondary text-small text-text-muted text-center wrap-break-word">
                  Receptor externo · {receptorEmailExterno}
                </p>
              ) : null}

              <p className="font-secondary text-caption text-text-muted">Receptor del préstamo</p>

              <div className="flex flex-wrap justify-center gap-2">
                <span className="font-secondary text-small px-3 py-1 rounded-full bg-(--color-cuaternario-200)">
                  {getLoanStatusLabel(loan.status)}
                </span>
                <span
                  className={`font-secondary text-small px-3 py-1 rounded-full ${
                    loan.isActive
                      ? "bg-(--color-primary-100) text-(--color-primary-950)"
                      : "bg-gray-800 text-text-primary"
                  }`}
                >
                  {loan.isActive ? "Registro activo" : "Registro inactivo"}
                </span>
              </div>
            </div>

            <div className="grid gap-5">
              <section className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <p className="sm:col-span-2 font-main text-body font-bold text-(--color-primary-950)">
                  Datos del préstamo
                </p>
                {/* (p48) Tipo de préstamo y grupo opcional */}
                <Field label="Tipo de préstamo" value={getLoanTypeLabel(loan.loanType)} />
                <Field
                  label="Grupo de aprendices"
                  value={loan.apprenticeGroup != null ? String(loan.apprenticeGroup) : "Sin grupo"}
                />
                <Field label="Fecha del préstamo" value={formatDateOnly(loan.loanDate)} />
                <Field label="Fecha de devolución" value={formatDateOnly(loan.returnDate)} />
                <Field label="Justificación de uso" value={loan.useJustification} className="sm:col-span-2" />
              </section>

              <section className="grid gap-x-6 gap-y-4 sm:grid-cols-2 border-t border-border pt-4">
                <p className="sm:col-span-2 font-main text-body font-bold text-(--color-primary-950)">
                  Firmas
                </p>
                <Field label="Prestador" value={lineaFirma("Prestador")} />
                <Field label="Receptor" value={lineaFirma("Receptor")} />
              </section>

              <section className="grid gap-3 border-t border-border pt-4">
                <p className="font-main text-body font-bold text-(--color-primary-950)">
                  Materiales
                </p>
                {(loan.materials ?? []).map((m) => {
                  const devuelto = m.returnedQuantity ?? 0;
                  const pendiente = m.borrowedQuantity - devuelto;
                  return (
                    <div key={m.materialId} className="min-w-0">
                      <p className="font-secondary text-small text-text-muted">
                        {getMaterialTypeLabel(m.consumableMaterial)}
                      </p>
                      <p className="font-secondary text-body wrap-break-word">
                        {m.consumableMaterial?.materialName ?? `#${m.materialId}`}
                      </p>
                      {/* Prestado / devuelto / pendiente: es lo que deja ver de un
                          vistazo si el préstamo tiene devoluciones parciales */}
                      <p className="font-secondary text-caption text-text-muted">
                        Prestado: {m.borrowedQuantity}
                        {devuelto > 0 && ` · devuelto: ${devuelto}`}
                        {pendiente > 0 ? ` · pendiente: ${pendiente}` : " · devuelto por completo"}
                      </p>
                    </div>
                  );
                })}
                {!(loan.materials ?? []).length && (
                  <p className="font-secondary text-body text-text-muted">—</p>
                )}
              </section>
            </div>
          </div>
        )}
      </Modal>

      {/* Visor de la foto ampliada, en su PROPIO portal: en el árbol de la página
          quedaría en otro contexto de apilamiento y el z-index no lo subiría */}
      {/* (p50) Visor compartido: ver ImageZoom. */}
      {loaded && receptor?.userPhoto && (
      <ImageZoom
        isOpen={zoom}
        onClose={() => setZoom(false)}
        label={`Foto de ${receptorLabel}`}
      >
        <UserPhoto
          photo={receptor?.userPhoto}
          alt={receptorLabel}
          className="w-full h-full"
        />
      </ImageZoom>
      )}
    </>
  );
}
