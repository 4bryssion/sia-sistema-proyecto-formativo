// (p48) El filtro por inventarios es nuevo: el reporte puede acotarse a uno o
// varios. Sin ninguno elegido entran TODOS. El inventario cuelga de la tabla
// PADRE, como el resto de lo común al material.
export function buildReportDataset({
  returnableMaterials,
  selectedFields,
  scope,
  placa_sena,
  inventoryIds = [],
}) {
  let filtered = [...returnableMaterials];

  if (inventoryIds.length) {
    const permitidos = new Set(inventoryIds.map(String));
    filtered = filtered.filter((item) =>
      permitidos.has(String(item.consumableMaterial?.inventoryId)),
    );
  }

  if (scope === "placa_sena" && placa_sena) {
    filtered = filtered.filter(
      (item) => item.consumableMaterial?.senaPlate === placa_sena
    );
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
