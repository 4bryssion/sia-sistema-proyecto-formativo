import { getLoanStatusLabel, getLoanTypeLabel } from "../../utils/loanStatusLabel";
import { partyLabel, documentoDe, firmaDe } from "@/shared/utils/loanParties";
import { formatDateOnly, formatAuditDate } from "@/shared/utils/formatDate";

// Se sigue exportando con este nombre porque lo usa el encabezado del reporte
// cuando se filtra por un solo solicitante
export const receiverName = (loan) => partyLabel(loan, "Receptor");

const firmaTexto = (loan, party) => {
  const sig = firmaDe(loan, party);
  if (!sig) return "";
  return sig.signed ? `Firmado el ${formatAuditDate(sig.signedAt)}` : "Sin firmar";
};

// (p48) Campos al día con el módulo: tipo de préstamo, receptor que puede ser
// externo (y entonces se identifica por su correo) y grupo de aprendices
// opcional.
export const loanReportFields = [
  {
    key: "id",
    label: "ID",
    default: true,
    // El listado es el único con columna de ID, y el reporte la acompaña: es lo
    // que permite cotejar una fila del papel con la de la pantalla
    getter: (l) => String(l.id),
  },
  {
    key: "receiver",
    label: "Usuario solicitante",
    default: true,
    getter: (l) => partyLabel(l, "Receptor"),
  },
  {
    key: "receiverDocument",
    label: "Documento del receptor",
    default: true,
    // Vacío cuando el receptor es externo: de él solo tenemos el correo, que ya
    // aparece en la columna del solicitante
    getter: (l) => documentoDe(l, "Receptor") ?? "",
  },
  {
    key: "lender",
    label: "Aprobado por",
    default: true,
    getter: (l) => partyLabel(l, "Prestador"),
  },
  {
    key: "loanType",
    label: "Tipo de préstamo",
    default: true,
    getter: (l) => getLoanTypeLabel(l.loanType),
  },
  {
    key: "materials",
    label: "Materiales",
    default: true,
    getter: (l) =>
      (l.materials ?? [])
        .map((m) => `${m.consumableMaterial?.materialName ?? "?"} (${m.borrowedQuantity})`)
        .join(", "),
  },
  {
    key: "totalQuantity",
    label: "Cantidad total",
    default: false,
    getter: (l) => (l.materials ?? []).reduce((acc, m) => acc + (m.borrowedQuantity ?? 0), 0),
  },
  {
    key: "apprenticeGroup",
    label: "Grupo de aprendices",
    default: true,
    // (p48) Opcional: sin grupo la celda va vacía, no en "0"
    getter: (l) => (l.apprenticeGroup != null ? String(l.apprenticeGroup) : ""),
  },
  {
    key: "status",
    label: "Estado",
    default: true,
    getter: (l) => getLoanStatusLabel(l.status),
  },
  {
    key: "useJustification",
    label: "Justificación de uso",
    default: false,
    getter: (l) => l.useJustification ?? "",
  },
  {
    key: "loanDate",
    label: "Fecha de préstamo",
    default: false,
    getter: (l) => formatDateOnly(l.loanDate),
  },
  {
    key: "returnDate",
    label: "Fecha de devolución",
    default: false,
    getter: (l) => formatDateOnly(l.returnDate),
  },
  {
    key: "lenderSignature",
    label: "Firma del prestador",
    default: false,
    getter: (l) => firmaTexto(l, "Prestador"),
  },
  {
    key: "receiverSignature",
    label: "Firma del receptor",
    default: false,
    getter: (l) => firmaTexto(l, "Receptor"),
  },
  {
    key: "isActive",
    label: "Registro",
    default: false,
    getter: (l) => (l.isActive ? "Activo" : "Inactivo"),
  },
];
