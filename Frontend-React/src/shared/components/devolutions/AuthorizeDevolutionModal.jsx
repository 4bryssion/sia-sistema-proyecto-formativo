// Autorizar devolución — modal. Es la segunda fase del retorno y la única
// operación que mueve inventario, así que el modal existe para decidir UNA cosa
// por material: en qué estado queda.
//
// Solo `Disponible` devuelve la cantidad al stock. Mantenimiento, Baja, Traslado
// y No disponible cambian el estado del material pero NO reintegran cantidad, y
// eso se avisa en pantalla porque es la consecuencia menos evidente.

import { useMemo, useState } from "react";
import { Modal, Select, TextArea, Button, Alert } from "@/shared";
import { ShieldCheck } from "lucide-react";
import devolutionService from "@/shared/services/devolutionService";
import {
  AUTHORIZE_STATUS_OPTIONS,
  STATUSES_REQUIRING_NOTE,
  getAuthorizeActionLabel,
  getMaterialTypeLabel,
  isReturnableMaterial,
  statusAppliesToMaterial,
} from "@/shared/utils/devolutionLabels";
import { formatAuditDate } from "@/shared/utils/formatDate";

const nombreDe = (u) => (u ? `${u.userFirstName} ${u.userLastName}` : "—");

export default function AuthorizeDevolutionModal({ isOpen, devolution, onClose, onSaved }) {
  // El estado arranca vacío para obligar a decidir material por material: un
  // valor por defecto haría que autorizar sin mirar dejara todo "Disponible"
  const [decisiones, setDecisiones] = useState({});
  const [errores, setErrores] = useState({});
  const [saving, setSaving] = useState(false);

  const items = useMemo(() => devolution?.items ?? [], [devolution]);

  const setCampo = (itemId, campo, valor) => {
    setDecisiones((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [campo]: valor } }));
    setErrores((prev) => ({ ...prev, [itemId]: undefined }));
  };

  const handleSubmit = async () => {
    const faltantes = {};
    items.forEach((item) => {
      if (!decisiones[item.id]?.materialStatus) {
        faltantes[item.id] = "Seleccione el estado del material";
      }
    });
    if (Object.keys(faltantes).length) {
      setErrores(faltantes);
      return;
    }

    setSaving(true);
    try {
      Alert.loading("Autorizando devolución...");
      await devolutionService.authorize(devolution.id, {
        items: items.map((item) => ({
          id: item.id,
          materialStatus: decisiones[item.id].materialStatus,
          authorizerObservations: decisiones[item.id].authorizerObservations ?? "",
        })),
      });
      Alert.close();
      Alert.success(
        "Devolución autorizada",
        "El inventario y el préstamo quedaron actualizados.",
      );
      onSaved?.();
      onClose?.();
    } catch (err) {
      Alert.close();
      const det = err.response?.data?.detalles;
      const msg = det?.length ? det.join(" · ") : (err.response?.data?.error ?? "Error al autorizar");
      Alert.error("Error al autorizar la devolución", msg);
    } finally {
      setSaving(false);
    }
  };

  if (!devolution) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getAuthorizeActionLabel(devolution)}
      size="lg"
      // Formulario: un clic fuera no puede descartar lo decidido
      closeOnBackdrop={false}
      closeButtonOutside
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" className="gap-2" onClick={handleSubmit} disabled={saving}>
            <ShieldCheck size={16} />
            {saving ? "Autorizando..." : "Autorizar devolución"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">

        {/* Cabecera: de qué préstamo viene, quién entregó y CUÁNDO se pidió */}
        <section className="grid gap-x-6 gap-y-3 sm:grid-cols-2 border-b border-border pb-4">
          <div>
            <p className="font-secondary text-small text-text-muted">Préstamo</p>
            <p className="font-secondary text-body">#{devolution.loanId}</p>
          </div>
          <div>
            <p className="font-secondary text-small text-text-muted">Entregado por</p>
            <p className="font-secondary text-body">{nombreDe(devolution.requestedBy)}</p>
          </div>
          <div>
            <p className="font-secondary text-small text-text-muted">Fecha y hora de la petición</p>
            <p className="font-secondary text-body">{formatAuditDate(devolution.requestedAt)}</p>
          </div>
          <div>
            <p className="font-secondary text-small text-text-muted">Grupo de aprendices</p>
            <p className="font-secondary text-body">{devolution.loan?.apprenticeGroup ?? "—"}</p>
          </div>
        </section>

        <p className="font-secondary text-caption text-text-muted">
          Solo <strong>Disponible</strong> devuelve la cantidad al inventario. Con los demás
          estados las unidades no vuelven al stock.
        </p>

        <div className="grid gap-4">
          {items.map((item) => {
            const material = item.consumableMaterial;
            const estado = decisiones[item.id]?.materialStatus ?? "";
            // Mantenimiento y Baja significan dañado, incompleto o no devuelto:
            // ahí es donde hace falta explicar qué pasó
            const pideNota = STATUSES_REQUIRING_NOTE.includes(estado);
            // En un material por cantidad la fila es el lote entero: el estado
            // se guarda en la devolución pero no se escribe sobre el material,
            // o se ensuciarían las unidades sanas que siguen en bodega
            const seAplica = statusAppliesToMaterial(material);

            return (
              <div key={item.id} className="grid gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0">
                  <p className="font-secondary text-small text-text-muted">
                    {getMaterialTypeLabel(material)}
                  </p>
                  <p className="font-secondary text-body wrap-break-word">
                    {material?.materialName ?? "—"}
                  </p>
                  <p className="font-secondary text-caption text-text-muted">
                    {isReturnableMaterial(material) ? "Devuelve" : "Sobrante"}: {item.returnedQuantity}
                  </p>
                  {item.requesterObservations && (
                    <p className="font-secondary text-caption text-text-muted wrap-break-word">
                      Observaciones de quien entrega: {item.requesterObservations}
                    </p>
                  )}
                  {/* Se avisa ANTES de elegir, no después: si no, el usuario
                      esperaría ver el material marcado y no lo vería */}
                  {!seAplica && estado && estado !== "Disponible" && (
                    <p className="font-secondary text-caption text-text-muted wrap-break-word">
                      Es un material por cantidad: el estado queda registrado en esta devolución,
                      no se marca sobre el material (marcarlo afectaría a las unidades sanas).
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
                  <Select
                    widthClass="w-full"
                    label="Estado del material devuelto"
                    name={`status-${item.id}`}
                    required
                    options={AUTHORIZE_STATUS_OPTIONS}
                    value={estado}
                    onChange={(e) => setCampo(item.id, "materialStatus", e.target.value)}
                    error={errores[item.id]}
                  />

                  {pideNota && (
                    <TextArea
                      widthClass="w-full"
                      label="Observaciones"
                      name={`obs-${item.id}`}
                      placeholder="Describa el daño o lo que falta"
                      maxLength={255}
                      value={decisiones[item.id]?.authorizerObservations ?? ""}
                      onChange={(e) => setCampo(item.id, "authorizerObservations", e.target.value)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
