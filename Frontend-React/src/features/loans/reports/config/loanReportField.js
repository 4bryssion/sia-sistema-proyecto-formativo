import { getLoanStatusLabel } from "../../utils/loanStatusLabel";

const partyName = (loan, party) => {
  const sig = loan.signatures?.find((s) => s.party === party);
  return sig?.user ? `${sig.user.userFirstName} ${sig.user.userLastName}` : "";
};

const fmtDate = (d) => (d ? String(d).slice(0, 10) : "");

export const receiverName = (loan) => partyName(loan, "Receptor");

export const loanReportFields = [
  {
    key: "receiver",
    label: "Usuario solicitante",
    default: true,
    getter: (l) => partyName(l, "Receptor"),
  },
  {
    key: "lender",
    label: "Aprobado por",
    default: false,
    getter: (l) => partyName(l, "Prestador"),
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
    getter: (l) => l.apprenticeGroup ?? "",
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
    getter: (l) => fmtDate(l.loanDate),
  },
  {
    key: "returnDate",
    label: "Fecha de devolución",
    default: false,
    getter: (l) => fmtDate(l.returnDate),
  },
];
