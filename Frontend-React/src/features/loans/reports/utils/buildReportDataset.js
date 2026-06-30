import { receiverName } from "../config/loanReportField";

export function buildReportDataset({
  loans = [],
  selectedFields,
  scope,
  usuario,
}) {
  let filtered = [...loans];

  if (scope === "user" && usuario) {
    const needle = usuario.trim().toLowerCase();
    filtered = filtered.filter((loan) => receiverName(loan).toLowerCase().includes(needle));
  }

  const headers = selectedFields.map((f) => f.label);

  const rows = filtered.map((loan) =>
    selectedFields.map((field) => {
      const value = field.getter ? field.getter(loan) : (loan[field.key] ?? "");
      return value ?? "";
    })
  );

  return { headers, rows };
}
