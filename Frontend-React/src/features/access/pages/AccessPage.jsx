import { useState, useEffect, useCallback } from "react";
import { getTopGroupName } from "@/features/users/utils/topGroup";
import { IconButton, Alert } from "@/shared";
import { Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/shared/services/axiosInstance";
import accessService from "../services/accessService";
import groupService from "@/features/groups/services/groupService";
import AccessLeft from "../components/AccessLeft";
import AccessRight from "../components/AccessRight";

export default function AccessPage() {
  const navigate = useNavigate();

  const [allGroups, setAllGroups]           = useState([]);
  const [allUsers, setAllUsers]             = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);

  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedUserId, setSelectedUserId]   = useState(null);

  // entityPermIds: permisos reales guardados en BD (solo directos en modo usuario)
  const [entityPermIds, setEntityPermIds]       = useState(new Set());
  // inheritedPermIds: permisos heredados via grupos del usuario (vacío en modo grupo)
  const [inheritedPermIds, setInheritedPermIds] = useState(new Set());
  // draftPermIds: copia de trabajo durante edición; fuera de edición refleja entityPermIds
  const [draftPermIds, setDraftPermIds]         = useState(new Set());

  const [isEditing, setIsEditing]       = useState(false);
  const [userGroupIds, setUserGroupIds] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    Promise.all([
      groupService.getAll(),
      api.get("/users").then((r) => r.data),
      api.get("/permissions").then((r) => r.data),
    ])
      .then(([groups, users, permissions]) => {
        // El SuperAdmin (grupo y usuarios) no aparece en el panel de administración
        setAllGroups(groups.filter((g) => g.groupName !== "SuperAdmin"));
        setAllUsers(users.filter((u) => getTopGroupName(u) !== "SuperAdmin"));
        setAllPermissions(permissions);
      })
      .catch(() => setError("Error cargando catálogos"));
  }, []);

  const loadGroupPerms = useCallback(async (groupId) => {
    setLoadingPerms(true);
    setError(null);
    try {
      const fresh = await groupService.getPermissions(groupId);
      const freshIds = new Set(fresh.map((p) => p.id));
      setEntityPermIds(freshIds);
      setInheritedPermIds(new Set());
      setDraftPermIds(new Set(freshIds));
    } catch {
      setError("Error cargando permisos del grupo");
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  const loadUserData = useCallback(async (userId) => {
    setLoadingPerms(true);
    setError(null);
    try {
      const [directPerms, userGroupsList] = await Promise.all([
        accessService.getUserPermissions(userId),
        accessService.getUserGroups(userId),
      ]);
      // Cargar en paralelo los permisos de cada grupo para calcular los heredados
      const groupPermsArrays = await Promise.all(
        userGroupsList.map((ug) => groupService.getPermissions(ug.group.id))
      );
      const directIds    = new Set(directPerms.map((p) => p.permissionId));
      const inheritedIds = new Set(groupPermsArrays.flat().map((p) => p.id));
      setEntityPermIds(directIds);
      setInheritedPermIds(inheritedIds);
      setDraftPermIds(new Set(directIds));
      setUserGroupIds(userGroupsList);
      setIsEditing(false);
    } catch {
      setError("Error cargando datos del usuario");
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  const handleGroupChange = (groupId) => {
    const id = groupId ? Number(groupId) : null;
    setIsEditing(false);
    setSelectedGroupId(id);
    setSelectedUserId(null);
    setEntityPermIds(new Set());
    setInheritedPermIds(new Set());
    setDraftPermIds(new Set());
    setUserGroupIds([]);
    if (id) loadGroupPerms(id);
  };

  const handleUserChange = (userId) => {
    const id = userId ? Number(userId) : null;
    setIsEditing(false);
    setSelectedUserId(id);
    setSelectedGroupId(null);
    setEntityPermIds(new Set());
    setInheritedPermIds(new Set());
    setDraftPermIds(new Set());
    setUserGroupIds([]);
    if (id) loadUserData(id);
  };

  const handleEdit = () => {
    setDraftPermIds(new Set(entityPermIds));
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setDraftPermIds(new Set(entityPermIds));
    setIsEditing(false);
    setError(null);
  };

  const handleToggle = (permId) => {
    setDraftPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const handleSave = async () => {
    setError(null);
    try {
      if (selectedGroupId) {
        // Un solo PUT reemplaza atómicamente todos los permisos del grupo (P36)
        await groupService.updatePermissions(selectedGroupId, [...draftPermIds]);
        const fresh = await groupService.getPermissions(selectedGroupId);
        const freshIds = new Set(fresh.map((p) => p.id));
        setEntityPermIds(freshIds);
        setDraftPermIds(new Set(freshIds));
        setIsEditing(false);
        Alert.success("Permisos actualizados", "Los cambios se aplicaron al grupo.");
      } else if (selectedUserId) {
        // Diff vs estado real: solo dispara POST/DELETE para los que cambiaron
        const toAdd    = [...draftPermIds].filter((id) => !entityPermIds.has(id));
        const toRemove = [...entityPermIds].filter((id) => !draftPermIds.has(id));
        await Promise.all([
          ...toAdd.map((id)    => accessService.assignPermission(selectedUserId, id)),
          ...toRemove.map((id) => accessService.removePermission(selectedUserId, id)),
        ]);
        await loadUserData(selectedUserId); // recarga y resetea isEditing=false
      }
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al guardar permisos");
      Alert.error("Error al guardar los permisos", err.response?.data?.error ?? "");
    }
  };

  const handleAssignGroup = async (groupId) => {
    if (!selectedUserId || !groupId) return;
    try {
      await accessService.assignGroup(selectedUserId, Number(groupId));
      await loadUserData(selectedUserId);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al asignar el grupo");
    }
  };

  const handleRemoveGroup = async (groupId) => {
    if (!selectedUserId) return;
    try {
      await accessService.removeGroup(selectedUserId, groupId);
      await loadUserData(selectedUserId);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al remover el grupo");
    }
  };

  let entityName = null;
  if (selectedGroupId) {
    entityName = allGroups.find((g) => g.id === selectedGroupId)?.groupName ?? "";
  } else if (selectedUserId) {
    const u = allUsers.find((u) => u.id === selectedUserId);
    if (u) entityName = `${u.userFirstName} ${u.userLastName ?? ""}`.trim();
    else entityName = "";
  }

  return (
    <div className="p-2">
      <div className="mb-2">
        <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
          <Undo2 strokeWidth={2.8} />
        </IconButton>
      </div>

      {error && (
        <p className="mb-2 text-sm text-red-600 px-4">{error}</p>
      )}

      <div className="p-6 grid 1400:grid-cols-[380px_1fr] 1400:h-[calc(100vh-160px)]">
        <div className="bg-black p-16 1400:h-full overflow-y-auto">
          <AccessLeft
            groups={allGroups}
            users={allUsers}
            selectedGroupId={selectedGroupId}
            selectedUserId={selectedUserId}
            onGroupChange={handleGroupChange}
            onUserChange={handleUserChange}
            userGroups={userGroupIds}
            onAssignGroup={handleAssignGroup}
            onRemoveGroup={handleRemoveGroup}
          />
        </div>

        <div className="bg-white p-4 overflow-y-auto">
          <AccessRight
            allPermissions={allPermissions}
            draftPermIds={draftPermIds}
            inheritedPermIds={inheritedPermIds}
            isEditing={isEditing}
            hasSelection={!!(selectedGroupId || selectedUserId)}
            entityName={entityName}
            loading={loadingPerms}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
