// Retornar préstamo — modal (reemplaza a /view/loans/:id/return).
//
// Una fila por material del préstamo, con su tipo, su nombre y su cantidad, tal
// como quedaron registrados al prestar. Al marcar una fila se abre el modal del
// material para declarar qué vuelve; al confirmar se registra UNA solicitud de
// devolución que queda en espera de autorización.
//
// El tipo (total o parcial) no se envía: lo deduce el backend. Aquí solo se
// anticipa para que el usuario sepa qué va a quedar registrado.

import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Checkbox, Alert } from "@/shared";
import { Undo2, Pencil } from "lucide-react";
import loanService from "@/features/loans/services/loanService";
import devolutionService from "../services/devolutionService";
import {
  getMaterialTypeLabel,
  isReturnableMaterial,
  pendingOf,
} from "../utils/devolutionLabels";
import ReturnItemModal from "./ReturnItemModal";

export default function ReturnLoanModal({ isOpen, loanId, onClose, onSaved }) {
  const [loan, setLoan] = useState(null);
  const [loadError, setLoadError] = useState(null);
  // Lo declarado por material: { [materialId]: { returnedQuantity, requesterObservations } }
  const [declarado, setDeclarado] = useState({});
  // Fila cuyo modal está abierto
  const [editando, setEditando] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !loanId) return;
    (async () => {
      setLoan(null);
      setDeclarado({});
      setEditando(null);
      setLoadError(null);
      try { setLoan(await loanService.getById(loanId)); }
      catch (err) { setLoadError(err.response?.data?.error ?? "Error al cargar el préstamo"); }
    })();
  }, [isOpen, loanId]);

  const cargado = loan && String(loan.id) === String(loanId);

  // Solo se puede devolver lo que aún está pendiente. Un material ya devuelto
  // por completo se muestra, pero apagado y sin casilla.
  const lineas = useMemo(() => loan?.materials ?? [], [loan]);
  const pendientes = lineas.filter((m) => pendingOf(m) > 0);

  const seleccionados = Object.keys(declarado).map(Number);
  const todosMarcados = pendientes.length > 0 && seleccionados.length === pendientes.length;

  // Misma regla que el backend: un consumible liquida su línea completa (lo
  // gastado no vuelve), un devolutivo solo lo que se entrega
  const seraTotal = useMemo(
    () =>
      pendientes.length > 0 &&
      pendientes.every((linea) => {
        const item = declarado[linea.materialId];
        if (!item) return false;
        if (!isReturnableMaterial(linea.consumableMaterial)) return true;
        return Number(item.returnedQuantity) >= pendingOf(linea);
      }),
    [pendientes, declarado],
  );

  const alternarFila = (linea, marcar) => {
    if (marcar) {
      // Marcar abre el modal: la fila no queda seleccionada hasta que se declara
      // qué vuelve, porque sin ese dato no hay nada que registrar
      setEditando(linea);
      return;
    }
    setDeclarado((prev) => {
      const copia = { ...prev };
      delete copia[linea.materialId];
      return copia;
    });
  };

  const alternarTodos = (marcar) => {
    if (!marcar) {
      setDeclarado({});
      return;
    }
    // Se rellena con el máximo pendiente de cada línea; cada fila se puede
    // ajustar después con el lápiz
    const todo = {};
    pendientes.forEach((linea) => {
      todo[linea.materialId] = {
        returnedQuantity: String(pendingOf(linea)),
        requesterObservations: declarado[linea.materialId]?.requesterObservations ?? "",
      };
    });
    setDeclarado(todo);
  };

  const guardarItem = (valor) => {
    setDeclarado((prev) => ({ ...prev, [editando.materialId]: valor }));
    setEditando(null);
  };

  const handleSubmit = async () => {
    if (!seleccionados.length) {
      Alert.error("Sin materiales", "Seleccione al menos un material para devolver.");
      return;
    }

    setSaving(true);
    try {
      Alert.loading("Registrando devolución...");
      await devolutionService.create({
        loanId: Number(loanId),
        items: seleccionados.map((materialId) => ({
          materialId,
          returnedQuantity: Number(declarado[materialId].returnedQuantity),
          requesterObservations: declarado[materialId].requesterObservations,
        })),
      });
      Alert.close();
      Alert.success(
        `Devolución ${seraTotal ? "total" : "parcial"} registrada`,
        "Queda en espera de que un administrador o instructor la autorice.",
      );
      onSaved?.();
      onClose?.();
    } catch (err) {
      Alert.close();
      const det = err.response?.data?.detalles;
      const msg = det?.length ? det.join(" · ") : (err.response?.data?.error ?? "Error al registrar la devolución");
      Alert.error("Error al registrar la devolución", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Retornar préstamo"
        size="lg"
        // Formulario: un clic fuera no puede descartar lo declarado
        closeOnBackdrop={false}
        closeButtonOutside
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-2"
              onClick={handleSubmit}
              disabled={saving || !seleccionados.length}
            >
              <Undo2 size={16} />
              {saving ? "Registrando..." : `Confirmar devolución ${seraTotal ? "total" : "parcial"}`}
            </Button>
          </>
        }
      >
        {loadError ? (
          <p className="text-error font-secondary">{loadError}</p>
        ) : !cargado ? (
          <p className="text-text-muted font-secondary">Cargando préstamo...</p>
        ) : (
          <div className="grid gap-5">
            <div className="grid gap-1">
              <p className="font-secondary text-body">
                Marque los materiales que se están devolviendo. Cada uno pedirá los datos
                de su devolución.
              </p>
              <p className="font-secondary text-caption text-text-muted">
                Si no devuelve todo, quedará registrada como devolución parcial y el préstamo
                seguirá activo con lo que falte.
              </p>
            </div>

            {pendientes.length > 1 && (
              <Checkbox
                id="devolver-todos"
                label="Seleccionar todos los materiales"
                checked={todosMarcados}
                onChange={(e) => alternarTodos(e.target.checked)}
                labelClassName="font-secondary text-small"
              />
            )}

            <div className="grid gap-3">
              {lineas.map((linea) => {
                const material = linea.consumableMaterial;
                const pendiente = pendingOf(linea);
                const devuelto = pendiente <= 0;
                const item = declarado[linea.materialId];

                return (
                  <div
                    key={linea.materialId}
                    className={`grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_auto] sm:items-center ${
                      devuelto ? "border-border opacity-50" : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {devuelto ? (
                        // Ya devuelto por completo: se muestra para dejar constancia,
                        // pero no se puede volver a devolver
                        <span className="font-secondary text-caption px-2 py-1 rounded-full bg-gray-900 shrink-0">
                          Devuelto
                        </span>
                      ) : (
                        <Checkbox
                          id={`material-${linea.materialId}`}
                          checked={Boolean(item)}
                          onChange={(e) => alternarFila(linea, e.target.checked)}
                        />
                      )}

                      <div className="min-w-0">
                        <p className="font-secondary text-small text-text-muted">
                          {getMaterialTypeLabel(material)}
                        </p>
                        <p className="font-secondary text-body wrap-break-word">
                          {material?.materialName ?? "—"}
                        </p>
                        <p className="font-secondary text-caption text-text-muted">
                          Cantidad prestada: {linea.borrowedQuantity}
                          {linea.returnedQuantity > 0 && ` · devuelto: ${linea.returnedQuantity}`}
                          {!devuelto && ` · pendiente: ${pendiente}`}
                        </p>
                      </div>
                    </div>

                    {/* Resumen de lo declarado, con acceso a corregirlo */}
                    {item && (
                      <button
                        type="button"
                        onClick={() => setEditando(linea)}
                        className="flex items-center gap-2 justify-self-start sm:justify-self-end font-secondary text-small cursor-pointer underline-offset-2 hover:underline"
                      >
                        <Pencil size={14} />
                        {isReturnableMaterial(material)
                          ? `Devuelve ${item.returnedQuantity} de ${pendiente}`
                          : `Sobrante ${item.returnedQuantity} de ${pendiente}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {!pendientes.length && (
              <p className="font-secondary text-body text-text-muted">
                Este préstamo ya no tiene materiales pendientes de devolver.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* key con el material: al cambiar de fila el modal se vuelve a montar y
          toma sus valores iniciales de `value`, sin efectos de sincronización */}
      <ReturnItemModal
        key={editando?.materialId ?? "ninguno"}
        isOpen={Boolean(editando)}
        loanMaterial={editando}
        value={editando ? declarado[editando.materialId] : null}
        onSave={guardarItem}
        onClose={() => setEditando(null)}
      />
    </>
  );
}
