import { useState } from "react";
import { Button, Input, Alert, Modal } from "@/shared";
import { brandSchema } from "@/shared/schemas/brandSchema";
import brandService from "@/shared/services/brandService";

// (p49) Antes dibujaba su propio overlay a mano: un clic fuera lo cerraba y se
// perdía lo escrito, no atendía Escape, no entraba en la pila de modales y
// repetía el marcado que ya resuelve `Modal`. Ahora usa el componente
// compartido, igual que sus gemelos de inventarios.
//
// La etiqueta del campo pasó a la prop `label` del Input, que ya la dibuja con
// font-secondary y el token de color; antes era un <label> a mano con
// `text-medium font-medium text-gray-700` — sin variable de tipografía y con el
// gris cableado.
//
// El cuerpo va en un componente aparte que solo se monta con el modal abierto:
// así el campo arranca con la marca que toca sin el useEffect que hacía setState
// (regla react-hooks/set-state-in-effect).
export default function EditBrandPage({ brand, isOpen, onClose, onSave }) {
  if (!isOpen || !brand) return null;

  return <EditBrandBody brand={brand} onClose={onClose} onSave={onSave} />;
}

function EditBrandBody({ brand, onClose, onSave }) {
  const [brandName, setBrandName] = useState(brand.brandName ?? "");
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
      await brandService.update(brand.id, result.data);
      Alert.success("Marca actualizada");
      onSave?.();
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.error ?? "Error al actualizar la marca";
      Alert.error("Error al actualizar la marca", msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Editar marca"
      size="sm"
      closeOnBackdrop={false}
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
      <Input
        type="text"
        label="Nombre"
        name="brandName"
        placeholder="Ingrese el nombre de la marca"
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
