import { useState } from "react";
import { Pencil, Users } from "lucide-react";
import { Switch, Alert, IconButton, PermissionGate, BlockedControl } from "@/shared";
import groupService from "@/shared/services/groupService";
import EditGroupModal from "../pages/EditGroupModal.jsx";
import GroupUsersModal from "../pages/GroupUsersModal.jsx";

export default function GroupRowActions({ group, onChanged }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  // (p51) RFADMIN43.1 y RFADMIN44.1: un rol del sistema no se renombra ni se
  // deshabilita. El backend lo rechaza igual, pero avisar aquí es decirlo ANTES
  // en vez de después de que la persona confirme una acción que iba a fallar.
  const esDelSistema = group.isSystem;
  const avisarProtegido = () => Alert.error(
    "Rol del sistema",
    `"${group.groupName}" es uno de los roles con los que el sistema se administra: `
    + 'su nombre y su estado no se pueden cambiar. Sus permisos sí, desde el panel de accesos.',
  );

  const handleToggle = async () => {
    // La petición en curso se corta aquí y no con `disabled`: un interruptor
    // deshabilitado no emite clic, y el envoltorio que avisa necesita el clic.
    if (toggling) return;

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

      <PermissionGate codename="toggle_group" accion="cambiar el estado de un rol">
        <BlockedControl bloqueado={esDelSistema} avisar={avisarProtegido}>
          <Switch
            checked={group.isActive}
            onChange={handleToggle}
            size="sm"
            className="inline-flex"
          />
        </BlockedControl>
      </PermissionGate>

      <PermissionGate codename="edit_group" accion="editar un rol">
        <BlockedControl bloqueado={esDelSistema} avisar={avisarProtegido}>
          <IconButton ariaLabel="Editar grupo" hitSize={36} iconSize={16} onClick={() => setIsEditOpen(true)}>
            <Pencil size={16} />
          </IconButton>
        </BlockedControl>
      </PermissionGate>

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
