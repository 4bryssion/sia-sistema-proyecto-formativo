import { useState, useEffect, useCallback } from "react";
import { IconButton } from "@/shared";
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

  const [entityPermIds, setEntityPermIds] = useState(new Set());
  const [userGroupIds, setUserGroupIds]   = useState([]);

  const [loadingPerms, setLoadingPerms] = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    Promise.all([
      groupService.getAll(),
      api.get("/users").then((r) => r.data),
      api.get("/permissions").then((r) => r.data),
    ])
      .then(([groups, users, permissions]) => {
        setAllGroups(groups);
        setAllUsers(users);
        setAllPermissions(permissions);
      })
      .catch(() => setError("Error cargando catálogos"));
  }, []);

  const loadGroupPerms = useCallback(async (groupId) => {
    setLoadingPerms(true);
    setError(null);
    try {
      const group = await groupService.getById(groupId);
      setEntityPermIds(new Set(group.permissions.map((p) => p.permissionId)));
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
      const [perms, groups] = await Promise.all([
        accessService.getUserPermissions(userId),
        accessService.getUserGroups(userId),
      ]);
      setEntityPermIds(new Set(perms.map((p) => p.permissionId)));
      setUserGroupIds(groups);
    } catch {
      setError("Error cargando datos del usuario");
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  const handleGroupChange = (groupId) => {
    const id = groupId ? Number(groupId) : null;
    setSelectedGroupId(id);
    setSelectedUserId(null);
    setEntityPermIds(new Set());
    setUserGroupIds([]);
    if (id) loadGroupPerms(id);
  };

  const handleUserChange = (userId) => {
    const id = userId ? Number(userId) : null;
    setSelectedUserId(id);
    setSelectedGroupId(null);
    setEntityPermIds(new Set());
    setUserGroupIds([]);
    if (id) loadUserData(id);
  };

  const handlePermissionToggle = async (permissionId) => {
    const has = entityPermIds.has(permissionId);
    try {
      if (selectedGroupId) {
        if (has) {
          await groupService.removePermission(selectedGroupId, permissionId);
        } else {
          await groupService.assignPermission(selectedGroupId, permissionId);
        }
        await loadGroupPerms(selectedGroupId);
      } else if (selectedUserId) {
        if (has) {
          await accessService.removePermission(selectedUserId, permissionId);
        } else {
          await accessService.assignPermission(selectedUserId, permissionId);
        }
        await loadUserData(selectedUserId);
      }
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al actualizar el permiso");
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

      <div className="p-6 grid 1400:grid-cols-[380px_1fr]">
        <div className="bg-black p-16 1400:h-full">
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

        <div className="bg-white p-4">
          <AccessRight
            allPermissions={allPermissions}
            entityPermIds={entityPermIds}
            onToggle={handlePermissionToggle}
            loading={loadingPerms}
            hasSelection={!!(selectedGroupId || selectedUserId)}
          />
        </div>
      </div>
    </div>
  );
}
