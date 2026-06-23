export function buildReportDataset({ users, selectedFields, scope, documentNumber }) {
  let filtered = [...users];

  if (scope === "document" && documentNumber) {
    filtered = filtered.filter((u) => u.userDocumentNumber === documentNumber);
  }

  const headers = selectedFields.map((f) => f.label);
  const rows = filtered.map((u) =>
    selectedFields.map((f) => (f.accessor ? f.accessor(u) : (u[f.key] ?? "")))
  );

  return { headers, rows };
}
