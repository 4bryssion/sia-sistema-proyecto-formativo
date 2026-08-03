import { useState } from "react";
import { Pencil, Users } from "lucide-react";
import { Switch, Alert, usePermissions } from "@/shared";
import groupService from "../services/groupService.js";
import EditGroupModal from "../pages/EditGroupModal.jsx";
import GroupUsersModal from "../pages/GroupUsersModal.jsx";

export default function GroupRowActions({ group, onChanged }) {
  const { can } = usePermissions();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    // Confirmación obligatoria antes de activar/desactivar (soft-delete)
    const result = await Alert.warning(
      `¿${group.isActive ? "Desactivar" : "Activar"} grupo?`,
      `"${group.groupName}" quedará ${group.isActive ? "inactivo" : "activo nuevamente"}.`
    );
    if (!result.isConfirmed) return;
    setToggling(true);
    try {
      await groupService.toggle(group.id);
      Alert.success(`Grupo ${group.isActive ? "desactivado" : "activado"}`);
      onChanged?.();
    } catch (err) {
      Alert.error("Error al cambiar estado", err.response?.data?.error ?? "");
      onChanged?.();
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center gap-3">

      {can("toggle_group") && (
      <Switch
        checked={group.isActive}
        onChange={handleToggle}
        disabled={toggling}
        size="sm"
        className="inline-flex"
      />
      )}

      {can("edit_group") && (
      <button
        onClick={() => setIsEditOpen(true)}
        className="p-1 rounded hover:bg-gray-900"
      >
        <Pencil size={16} />
      </button>
      )}

      {/* Ver usuarios del grupo: mismo permiso que listar grupos */}
      <button
        onClick={() => setIsUsersOpen(true)}
        className="p-1 rounded hover:bg-gray-900"
        title="Ver usuarios del grupo"
      >
        <Users size={16} />
      </button>

      <GroupUsersModal
        group={group}
        isOpen={isUsersOpen}
        onClose={() => setIsUsersOpen(false)}
      />

      <EditGroupModal
        group={group}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={onChanged}
      />
    </div>
  );
}
