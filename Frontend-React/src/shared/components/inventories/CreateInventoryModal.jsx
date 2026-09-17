import { useState } from "react";
import { Button, Input, Alert, Modal } from "@/shared";
import { inventorySchema } from "@/shared/schemas/inventorySchema";
import inventoryService from "@/shared/services/inventoryService";

// Modal de crear inventario (gemelo de CreateBrandModal). Vive en shared porque
// lo abre el formulario de materiales: "Crear y asignar nuevo inventario".
// onSave recibe el inventario creado para que el consumidor pueda autoseleccionarlo.
//
// El cuerpo va en un componente aparte que solo se monta con isOpen en true:
// así cada apertura arranca con el campo vacío sin necesidad de un useEffect
// que haga setState (regla react-hooks/set-state-in-effect).
export default function CreateInventoryModal({ isOpen, onClose, onSave }) {
  if (!isOpen) return null;

  return <CreateInventoryBody onClose={onClose} onSave={onSave} />;
}

function CreateInventoryBody({ onClose, onSave }) {
  const [inventoryName, setInventoryName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const result = inventorySchema.safeParse({ inventoryName });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Dato inválido");
      return;
    }
    setSaving(true);
    try {
      const res = await inventoryService.create(result.data);
      Alert.success("Inventario creado");
      onSave?.(res?.data ?? res);
      onClose?.();
    } catch (err) {
      const msg =
        err.response?.data?.detalles?.join(" · ") ??
        err.response?.data?.error ??
        "Error al crear el inventario";
      Alert.error("Error al crear el inventario", msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Crear Inventario"
      size="sm"
      closeOnBackdrop={false}
      showCloseButton={false}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Crear"}
          </Button>
        </>
      }
    >
      <label className="font-secondary mb-1 block text-medium font-medium text-gray-700">
        Nombre del inventario
      </label>
      <Input
        type="text"
        name="inventoryName"
        placeholder="Ej: Inventario ambiente 301"
        value={inventoryName}
        onChange={(e) => {
          setInventoryName(e.target.value);
          setError("");
        }}
        error={error}
      />
    </Modal>
  );
}
