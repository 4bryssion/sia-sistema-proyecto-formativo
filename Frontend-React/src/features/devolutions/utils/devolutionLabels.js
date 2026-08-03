// Etiquetas del subsistema de devoluciones.
//
// Los dos estados que pide el requerimiento ("En espera de autorizar devolución
// total" y "... parcial") no existen como un enum de cuatro valores en la base:
// son la combinación de `type` (Total | Parcial) y `status` (En_espera |
// Autorizada). La frase se compone aquí, en un solo sitio, para que el listado,
// el dropdown de acciones y los modales digan exactamente lo mismo.

export const DEVOLUTION_TYPE_LABELS = {
  Total: "total",
  Parcial: "parcial",
};

/** Estado visible de una solicitud de devolución */
export const getDevolutionStatusLabel = (devolution) => {
  const tipo = DEVOLUTION_TYPE_LABELS[devolution?.type] ?? "";
  return devolution?.status === "Autorizada"
    ? `Devolución ${tipo} autorizada`
    : `En espera de autorizar devolución ${tipo}`;
};

/** Texto de la acción que abre el modal de autorizar */
export const getAuthorizeActionLabel = (devolution) =>
  `Autorizar devolución ${DEVOLUTION_TYPE_LABELS[devolution?.type] ?? ""}`.trim();

// Estados que puede elegir quien autoriza. `Disponible` es el único que devuelve
// la cantidad al inventario; el resto solo cambia el estado del material.
// `En_prestamo` no está: un material que se acaba de devolver no puede quedar
// marcado como prestado.
export const AUTHORIZE_STATUS_OPTIONS = [
  { value: "Disponible",    label: "Disponible" },
  { value: "No_disponible", label: "No disponible" },
  { value: "Mantenimiento", label: "Mantenimiento" },
  { value: "Traslado",      label: "Traslado" },
  { value: "Baja",          label: "Baja" },
];

// Estados que implican que el material llegó dañado, incompleto o no llegó: la
// interfaz pide observaciones cuando se elige uno de estos
export const STATUSES_REQUIRING_NOTE = ["Mantenimiento", "Baja"];

/** ¿El material es devolutivo? Lo delata la fila hermana en returnable_materials */
export const isReturnableMaterial = (material) => Boolean(material?.returnable);

/** Etiqueta de tipo, la misma que usa el formulario de préstamo */
export const getMaterialTypeLabel = (material) =>
  isReturnableMaterial(material) ? "Material devolutivo" : "Material de consumo";

/** Unidades que aún deben volver de una línea del préstamo */
export const pendingOf = (loanMaterial) =>
  (loanMaterial?.borrowedQuantity ?? 0) - (loanMaterial?.returnedQuantity ?? 0);
