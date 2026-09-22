import { useState } from "react";
import { Button, Input, Checkbox, Alert, Modal } from "@/shared";
import { categorySchema } from "@/shared/schemas/categorySchema";
import categoryService from "@/shared/services/categoryService";

// Modal de crear categoría (gemelo de CreateBrandModal y CreateInventoryModal).
// Vive en shared porque lo abre el formulario de material devolutivo con
// "Crear y asignar nueva categoría": el módulo de materiales no puede depender
// del de categorías.
//
// onSave recibe la categoría creada para que el consumidor pueda autoseleccionarla.
//
// El cuerpo va en un componente aparte que solo se monta con isOpen en true: así
// cada apertura arranca en blanco sin un useEffect que haga setState (regla
// react-hooks/set-state-in-effect).
export default function CreateCategoryModal({ isOpen, onClose, onSave }) {
  if (!isOpen) return null;

  return <CreateCategoryBody onClose={onClose} onSave={onSave} />;
}

function CreateCategoryBody({ onClose, onSave }) {
  const [categoryName, setCategoryName] = useState("");
  const [requiresDimensions, setRequiresDimensions] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const result = categorySchema.safeParse({ categoryName, requiresDimensions });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Dato inválido");
      return;
    }
    setSaving(true);
    try {
      const res = await categoryService.create(result.data);
      Alert.success("Categoría creada");
      onSave?.(res?.data ?? res);
      onClose?.();
    } catch (err) {
      const msg =
        err.response?.data?.detalles?.join(" · ") ??
        err.response?.data?.error ??
        "Error al crear la categoría";
      Alert.error("Error al crear la categoría", msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Crear Categoría"
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
      <div className="flex flex-col gap-5">
        <Input
          type="text"
          label="Nombre de la categoría"
          name="categoryName"
          placeholder="Ej: Equipos de cómputo"
          value={categoryName}
          onChange={(e) => {
            setCategoryName(e.target.value);
            setError("");
          }}
          error={error}
        />

        <div>
          <Checkbox
            id="requiresDimensions"
            name="requiresDimensions"
            checked={requiresDimensions}
            onChange={(e) => setRequiresDimensions(e.target.checked)}
            labelClassName="text-medium"
            label="Los materiales de esta categoría deben indicar dimensiones"
          />
          <p className="mt-1 font-secondary text-caption text-text-muted">
            Marca esto para categorías cuyo tamaño importa, como muebles y enseres.
            El campo de dimensiones solo se pide en ellas.
          </p>
        </div>
      </div>
    </Modal>
  );
}
