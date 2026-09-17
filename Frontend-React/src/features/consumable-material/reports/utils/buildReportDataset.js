// (p48) El filtro por inventarios es nuevo: el reporte puede acotarse a uno o
// varios. Sin ninguno elegido entran TODOS, que es lo que se espera de un filtro
// vacío. Los ids llegan como strings (vienen del Select) y el material los tiene
// como número, así que se comparan normalizados a texto.
export function buildReportDataset({
  consumableMaterials,
  selectedFields,
  scope,
  placa_sena,
  inventoryIds = [],
}) {
  let filtered = [...consumableMaterials];

  if (inventoryIds.length) {
    const permitidos = new Set(inventoryIds.map(String));
    filtered = filtered.filter((item) => permitidos.has(String(item.inventoryId)));
  }

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
