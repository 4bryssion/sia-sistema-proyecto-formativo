import { useState } from "react";
import { Button, Input, Alert, Modal } from "@/shared";
import { inventorySchema } from "@/shared/schemas/inventorySchema";
import inventoryService from "@/shared/services/inventoryService";

// Modal de edición (misma forma que EditBrandPage, pero sobre el Modal
// compartido: es un formulario, así que NO se cierra con clic fuera).
//
// El cuerpo está separado en InventoryEditBody para que el estado nazca ya
// con el nombre del inventario en lugar de sincronizarlo con un useEffect:
// ese `setState` dentro del efecto es lo que marca la regla
// react-hooks/set-state-in-effect. Al montar el cuerpo solo cuando isOpen es
// true, cada apertura arranca con valores limpios sin efecto alguno.
export default function EditInventoryPage({ inventory, isOpen, onClose, onSave }) {
  if (!isOpen || !inventory) return null;

  return (
    <InventoryEditBody
      inventory={inventory}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function InventoryEditBody({ inventory, onClose, onSave }) {
  const [inventoryName, setInventoryName] = useState(inventory.inventoryName ?? "");
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
      await inventoryService.update(inventory.id, result.data);
      Alert.success("Inventario actualizado");
      onSave?.();
      onClose?.();
    } catch (err) {
      const msg =
        err.response?.data?.detalles?.join(" · ") ??
        err.response?.data?.error ??
        "Error al actualizar el inventario";
      Alert.error("Error al actualizar el inventario", msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Editar inventario"
      size="sm"
      closeOnBackdrop={false}
      // La X va fuera de la tarjeta, en la esquina: es la regla del proyecto
      // para los modales de formulario (dentro le restaba espacio al contenido).
      closeButtonOutside
      showCloseButton={false}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </>
      }
    >
      <label className="font-secondary mb-1 block text-medium font-medium text-gray-700">
        Nombre
      </label>
      <Input
        type="text"
        name="inventoryName"
        placeholder="Ingrese el nombre del inventario"
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
