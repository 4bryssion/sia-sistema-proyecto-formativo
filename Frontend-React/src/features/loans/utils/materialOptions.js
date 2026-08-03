// Opciones de material para el formulario de préstamo: mezcla consumibles y
// devolutivos en una sola lista.
//
// El `value` es SIEMPRE el id del ConsumableMaterial, que es al que apunta
// loan_materials — el devolutivo hereda ese mismo id. Solo entran los que están
// en estado Disponible.

// Etiqueta visible del tipo. Vive aquí y no en el componente para que el
// formulario de préstamo y los modales de retorno digan exactamente lo mismo.
export const TYPE_LABELS = {
  consumible: "Material de consumo",
  devolutivo: "Material devolutivo",
};

export const getTypeLabel = (type) => TYPE_LABELS[type] ?? "";

// Cantidad que se puede prestar de un material.
// `quantity == null` ⇒ serializado (tiene placa SENA): es una unidad única, así
// que su disponible es 1. Es el mismo criterio que usa el backend en el modelo
// de stock de préstamos y retornos.
const disponibleDe = (material) => material.quantity ?? 1;

export function buildMaterialOptions(consumables = [], returnables = []) {
  const map = new Map();

  consumables
    .filter((m) => m.status === "Disponible")
    .forEach((m) =>
      map.set(String(m.id), {
        value: String(m.id),
        label: m.materialName,
        type: "consumible",
        available: disponibleDe(m),
      }),
    );

  returnables
    .filter((r) => r.consumableMaterial?.status === "Disponible")
    .forEach((r) =>
      map.set(String(r.consumableMaterial.id), {
        value: String(r.consumableMaterial.id),
        label: r.consumableMaterial.materialName,
        type: "devolutivo",
        available: disponibleDe(r.consumableMaterial),
      }),
    );

  return [...map.values()];
}
