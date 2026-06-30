// Builds material options for the loan form, merging consumables and returnables.
// Each option carries `type` ("consumible" | "devolutivo"). The value is always the
// ConsumableMaterial id (what loan_materials references). Only Disponible items are included.
export function buildMaterialOptions(consumables = [], returnables = []) {
  const map = new Map();

  consumables
    .filter((m) => m.status === "Disponible")
    .forEach((m) =>
      map.set(String(m.id), { value: String(m.id), label: m.materialName, type: "consumible" })
    );

  returnables
    .filter((r) => r.consumableMaterial?.status === "Disponible")
    .forEach((r) =>
      map.set(String(r.consumableMaterial.id), {
        value: String(r.consumableMaterial.id),
        label: r.consumableMaterial.materialName,
        type: "devolutivo",
      })
    );

  return [...map.values()];
}
