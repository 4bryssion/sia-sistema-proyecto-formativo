import { useState } from "react";
import { Button, Input, Checkbox, Alert, Modal } from "@/shared";
import { categorySchema } from "@/shared/schemas/categorySchema";
import categoryService from "@/shared/services/categoryService";

// Editar categoría (gemelo de EditBrandPage y EditInventoryPage).
//
// El cuerpo va en un componente aparte que solo se monta con el modal abierto:
// así los campos arrancan con la categoría que toca sin un useEffect que haga
// setState (regla react-hooks/set-state-in-effect).
export default function EditCategoryModal({ category, isOpen, onClose, onSave }) {
  if (!isOpen || !category) return null;

  return <EditCategoryBody category={category} onClose={onClose} onSave={onSave} />;
}

function EditCategoryBody({ category, onClose, onSave }) {
  const [categoryName, setCategoryName] = useState(category.categoryName ?? "");
  const [requiresDimensions, setRequiresDimensions] = useState(!!category.requiresDimensions);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const result = categorySchema.safeParse({ categoryName, requiresDimensions });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Dato inválido");
      return;
    }

    // Quitar la exigencia de dimensiones no borra las medidas ya guardadas, pero
    // sí deja de pedirlas: conviene que quien lo hace sepa lo que cambia.
    if (category.requiresDimensions && !requiresDimensions) {
      const confirmar = await Alert.warning(
        "¿Dejar de exigir dimensiones?",
        `Los materiales nuevos de "${categoryName}" ya no pedirán dimensiones. Los que ya las tienen las conservan.`,
      );
      if (!confirmar.isConfirmed) return;
    }

    setSaving(true);
    try {
      await categoryService.update(category.id, result.data);
      Alert.success("Categoría actualizada");
      onSave?.();
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.error ?? "Error al actualizar la categoría";
      Alert.error("Error al actualizar la categoría", msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Editar Categoría"
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
      <div className="flex flex-col gap-5">
        <Input
          type="text"
          label="Nombre de la categoría"
          name="categoryName"
          value={categoryName}
          onChange={(e) => {
            setCategoryName(e.target.value);
            setError("");
          }}
          error={error}
        />

        <div>
          <Checkbox
            id="requiresDimensionsEdit"
            name="requiresDimensions"
            checked={requiresDimensions}
            onChange={(e) => setRequiresDimensions(e.target.checked)}
            labelClassName="text-medium"
            label="Los materiales de esta categoría deben indicar dimensiones"
          />
          <p className="mt-1 font-secondary text-caption text-text-muted">
            El campo de dimensiones solo se pide en las categorías marcadas.
          </p>
        </div>
      </div>
    </Modal>
  );
}
