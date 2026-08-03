import { useState, useEffect } from "react";
import { Button, Input, Alert } from "@/shared";
import { brandSchema } from "../schemas/brandSchema.js";
import brandService from "../services/brandService.js";

// Modal de crear marca (mismo patrón que CreateGroupModal de groups).
// onSave recibe la marca creada para que el consumidor pueda autoseleccionarla.
export default function CreateBrandModal({ isOpen, onClose, onSave }) {
  const [brandName, setBrandName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBrandName("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* text-neutral-900 explícito para no heredar colores claros del contexto */}
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 text-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-xl font-semibold">Crear Marca</h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre de la marca
          </label>
          <Input
            type="text"
            name="brandName"
            placeholder="Ej: Bosch"
            value={brandName}
            onChange={(e) => {
              setBrandName(e.target.value);
              setError("");
            }}
            error={error}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Crear"}
          </Button>
        </div>
      </div>
    </div>
  );
}
