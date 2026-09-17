import { useState, useEffect } from "react";
import { Button, Input, Alert } from "@/shared";
import { brandSchema } from "@/shared/schemas/brandSchema";
import brandService from "@/shared/services/brandService";

export default function EditBrandPage({ brand, isOpen, onClose, onSave }) {

  const [brandName, setBrandName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && brand) {
      setBrandName(brand.brandName ?? "");
      setError("");
    }
  }, [isOpen, brand]);

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-main mb-6 text-h3 font-semibold">Editar marca</h2>

        <div className="mb-4">
          <label className="mb-1 block text-medium font-medium text-gray-700">Nombre</label>
          <Input
            type="text"
            name="brandName"
            placeholder="Ingrese el nombre de la marca"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            error={error}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
