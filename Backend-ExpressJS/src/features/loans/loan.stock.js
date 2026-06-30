// Helpers de stock de préstamos. Cantidad efectiva = quantity ?? 1.
// - quantity numérico: material por cantidad (descuenta/repone).
// - quantity null: material serializado (placa SENA), implícito 1, solo cambia status.

// Validación pura (service). Devuelve string de error o null si es válido.
// ownedQty = cantidad que el préstamo en edición YA tiene de este material (se restaurará).
export function checkAvailability(material, requestedQty, ownedQty = 0) {
  if (material.quantity == null) {
    if (requestedQty !== 1) {
      return `El material ${material.materialName} es serializado (placa SENA): la cantidad debe ser 1.`;
    }
    const available = material.status === 'Disponible' || ownedQty > 0;
    if (!available) {
      return `El material ${material.materialName} no está disponible (estado: ${material.status}).`;
    }
    return null;
  }
  // material por cantidad
  if (ownedQty === 0 && material.status !== 'Disponible') {
    return `El material ${material.materialName} no está disponible (estado: ${material.status}).`;
  }
  const available = material.quantity + ownedQty;
  if (requestedQty > available) {
    return `La cantidad solicitada (${requestedQty}) supera el stock disponible (${available}) de ${material.materialName}.`;
  }
  return null;
}

// Aplica el préstamo de q unidades (dentro de una tx). `material` es snapshot fresco.
export async function applyLend(tx, material, q) {
  if (material.quantity == null) {
    await tx.consumableMaterial.update({
      where: { id: material.id },
      data: { status: 'En_prestamo' },
    });
  } else {
    const newQty = material.quantity - q;
    await tx.consumableMaterial.update({
      where: { id: material.id },
      data: { quantity: newQty, ...(newQty === 0 ? { status: 'En_prestamo' } : {}) },
    });
  }
}

// Restaura q unidades (dentro de una tx). `material` es snapshot fresco.
export async function applyRestore(tx, material, q) {
  if (material.quantity == null) {
    if (material.status === 'En_prestamo') {
      await tx.consumableMaterial.update({
        where: { id: material.id },
        data: { status: 'Disponible' },
      });
    }
  } else {
    const newQty = material.quantity + q;
    await tx.consumableMaterial.update({
      where: { id: material.id },
      data: { quantity: newQty, ...(material.status === 'En_prestamo' ? { status: 'Disponible' } : {}) },
    });
  }
}
