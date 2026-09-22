import { useState } from "react";
import { Pencil, Users } from "lucide-react";
import { Switch, Alert, usePermissions, IconButton } from "@/shared";
import groupService from "@/shared/services/groupService";
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
      <IconButton ariaLabel="Editar grupo" hitSize={36} iconSize={16} onClick={() => setIsEditOpen(true)}>
        <Pencil size={16} />
      </IconButton>
      )}

      {/* Ver usuarios del grupo: mismo permiso que listar grupos */}
      <IconButton
        ariaLabel="Ver usuarios del grupo"
        title="Ver usuarios del grupo"
        hitSize={36}
        iconSize={16}
        onClick={() => setIsUsersOpen(true)}
      >
        <Users size={16} />
      </IconButton>

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
