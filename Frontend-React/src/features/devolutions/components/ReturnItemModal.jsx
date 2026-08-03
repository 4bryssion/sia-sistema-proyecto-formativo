// Modal de un material dentro del retorno de préstamo.
//
// Se abre al marcar la casilla de una fila y cambia según el tipo de material,
// porque lo que se declara es distinto:
// - Devolutivo: en qué estado vuelve y cuántas unidades se entregan.
// - Consumible: solo cuánto sobró; lo consumido no va a volver.
//
// Va sobre el modal de retorno (dos portales al body: el último se dibuja
// encima). Escape se atiende en fase de captura para cerrar SOLO este y no
// arrastrar al de atrás, que también escucha Escape.

import { useEffect, useState } from "react";
import { Modal, Input, TextArea, Button } from "@/shared";
import { getMaterialTypeLabel, isReturnableMaterial, pendingOf } from "../utils/devolutionLabels";

export default function ReturnItemModal({ isOpen, loanMaterial, value, onSave, onClose }) {
  const material = loanMaterial?.consumableMaterial;
  const esDevolutivo = isReturnableMaterial(material);
  const pendiente = pendingOf(loanMaterial);
  // Con una sola unidad pendiente no hay nada que decidir: se autollena y se
  // bloquea el campo
  const unicaUnidad = pendiente === 1;

  // El estado arranca de las props y NO se resincroniza con un efecto: el padre
  // pasa `key` con el id del material, así que al cambiar de fila este componente
  // se vuelve a montar y los valores iniciales se leen de nuevo. Sincronizarlo
  // con un setState dentro de un efecto encadenaría un render extra para llegar
  // al mismo sitio (y el linter lo marca).
  const [cantidad, setCantidad] = useState(
    () => value?.returnedQuantity ?? (unicaUnidad ? "1" : "0"),
  );
  const [observaciones, setObservaciones] = useState(() => value?.requesterObservations ?? "");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose?.();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [isOpen, onClose]);

  if (!loanMaterial) return null;

  const handleCantidad = (e) => {
    // Solo dígitos, sin ceros a la izquierda y con tope en lo pendiente
    let limpia = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    if (limpia === "") limpia = "0";
    if (Number(limpia) > pendiente) limpia = String(pendiente);
    setCantidad(limpia);
  };

  const handleSave = () => {
    // Un devolutivo tiene que volver: si no se entrega nada, no hay devolución
    // que registrar. En un consumible 0 es legítimo (se gastó todo).
    if (esDevolutivo && Number(cantidad) < 1) {
      setError("Indique cuántas unidades se están devolviendo.");
      return;
    }
    onSave({ returnedQuantity: String(cantidad), requesterObservations: observaciones.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esDevolutivo ? "Devolución de material devolutivo" : "Cantidad sobrante"}
      size="sm"
      // Formulario: un clic fuera no puede descartar lo escrito
      closeOnBackdrop={false}
      closeButtonOutside
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div>
          <p className="font-secondary text-small text-text-muted">
            {getMaterialTypeLabel(material)}
          </p>
          <p className="font-main text-body font-bold wrap-break-word">
            {material?.materialName ?? "—"}
          </p>
          <p className="font-secondary text-caption text-text-muted">
            Cantidad prestada: {loanMaterial.borrowedQuantity}
            {loanMaterial.returnedQuantity > 0 && ` · ya devuelto: ${loanMaterial.returnedQuantity}`}
          </p>
        </div>

        <Input
          widthClass="w-full"
          label={esDevolutivo ? "Cantidad que se devuelve" : "Cantidad sobrante (opcional)"}
          name="returnedQuantity"
          type="text"
          inputMode="numeric"
          required={esDevolutivo}
          // El formato "0/prestada" del formulario de préstamo: se escribe a la
          // izquierda del "/" y el tope es lo que queda pendiente
          suffix={`/${pendiente}`}
          value={cantidad}
          onChange={handleCantidad}
          disabled={unicaUnidad}
          title={unicaUnidad ? "Solo hay una unidad pendiente" : undefined}
          error={error}
        />

        {/* Las observaciones son del devolutivo: describen en qué estado llega.
            En un consumible lo único que se declara es cuánto sobró. */}
        {esDevolutivo && (
          <TextArea
            widthClass="w-full"
            label="Observaciones del estado en que se devuelve el material"
            name="requesterObservations"
            placeholder="Ej: vuelve con un rayón en la suela"
            maxLength={255}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        )}
      </div>
    </Modal>
  );
}
