import { useState, useEffect } from "react";
import { Button, Input, Alert } from "@/shared";
import { groupSchema } from "../schemas/groupSchema.js";
import groupService from "../services/groupService.js";

export default function EditGroupModal({ group, isOpen, onClose, onSave }) {

  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      setGroupName(group.groupName ?? "");
      setError("");
    }
  }, [isOpen, group]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const result = groupSchema.safeParse({ groupName });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Dato inválido");
      return;
    }

    setSaving(true);
    try {
      await groupService.update(group.id, result.data);
      Alert.success("Grupo actualizado");
      onSave?.();
      onClose?.();
    } catch (err) {
      const msg = err.response?.data?.error ?? "Error al actualizar el grupo";
      Alert.error("Error al actualizar el grupo", msg);
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
        <h2 className="mb-6 text-xl font-semibold">Editar Grupo</h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre del grupo
          </label>
          <Input
            type="text"
            name="groupName"
            placeholder="Ingrese el nombre del grupo"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
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
