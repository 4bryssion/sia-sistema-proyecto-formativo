export function buildReportDataset({
  consumableMaterials,
  selectedFields,
  scope,
  placa_sena,
}) {
  let filtered = [...consumableMaterials];

  if (scope === "placa_sena" && placa_sena) {
    filtered = filtered.filter((item) => item.senaPlate === placa_sena);
  }

  const headers = selectedFields.map((f) => f.label);

  const rows = filtered.map((item) =>
    selectedFields.map((field) => {
      const value = field.getter ? field.getter(item) : (item[field.key] ?? "");
      return value ?? "";
    })
  );

  return { headers, rows };
}
