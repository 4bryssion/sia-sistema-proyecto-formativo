import { useState } from "react";
import { Button, Input, Alert, Modal } from "@/shared";
import { brandSchema } from "@/shared/schemas/brandSchema";
import brandService from "@/shared/services/brandService";

// Modal de crear marca (mismo patrón que CreateInventoryModal).
// onSave recibe la marca creada para que el consumidor pueda autoseleccionarla.
//
// El cuerpo va en un componente aparte que solo se monta con isOpen en true: así
// cada apertura arranca con el campo vacío sin el useEffect que hacía setState
// (regla react-hooks/set-state-in-effect).
export default function CreateBrandModal({ isOpen, onClose, onSave }) {
  if (!isOpen) return null;

  return <CreateBrandBody onClose={onClose} onSave={onSave} />;
}

function CreateBrandBody({ onClose, onSave }) {
  const [brandName, setBrandName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const result = brandSchema.safeParse({ brandName });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Dato inválido");
      return;
    }
    setSaving(true);
    try {
      const res = await brandService.create(result.data);
      setBrandName("");
      setError("");
      Alert.success("Marca creada");
      onSave?.(res?.data ?? res);
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.error ?? "Error al crear la marca";
      Alert.error("Error al crear la marca", msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // (p49) Antes dibujaba su propio overlay a mano: se cerraba con un clic fuera
  // —perdiendo lo escrito—, no atendía Escape ni entraba en la pila de modales, y
  // repetía el marcado que ya resuelve `Modal`. Ahora usa el componente
  // compartido, igual que su gemelo de inventarios. La etiqueta del campo pasó a
  // la prop `label` del Input, que ya la dibuja con font-secondary y el token de
  // color (antes era un <label> a mano con text-gray-700 cableado).
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Crear Marca"
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
      <Input
        type="text"
        label="Nombre de la marca"
        name="brandName"
        placeholder="Ej: Bosch"
        value={brandName}
        onChange={(e) => {
          setBrandName(e.target.value);
          setError("");
        }}
        error={error}
      />
    </Modal>
  );
}
