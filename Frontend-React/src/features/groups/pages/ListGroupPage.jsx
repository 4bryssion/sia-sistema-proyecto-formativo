import { useState } from "react";
import { DataTable, Button, StatusFilterSelect, PermissionGate, ListPageHeader } from "@/shared";
import { groupColumns } from "../table/groupColumns";
import { useGroups } from "../hooks/useGroups";
import CreateGroupModal from "@/shared/components/groups/CreateGroupModal";

export default function ListGroupPage() {
  const [status, setStatus] = useState("active");
  const { groups, loading, error, refetch } = useGroups(status);
  // El grupo SuperAdmin ya viene excluido por el backend (systemIdentities.js)
  const visibleGroups = groups;
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-6">

      <ListPageHeader title="Grupos">
        <StatusFilterSelect value={status} onChange={setStatus} />

        {/* (p51) El permiso se consulta ANTES, no después: sin el gate el
            botón se veía igual para todos y el "no" llegaba del servidor
            cuando el formulario ya estaba lleno. */}
        <PermissionGate codename="create_group" accion="crear grupos">
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Crear Grupo
          </Button>
        </PermissionGate>
      </ListPageHeader>

      {loading ? (
        <p className="text-gray-600">Cargando grupos...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : (
        <DataTable data={visibleGroups} columns={groupColumns(refetch)} />
      )}

      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={refetch}
      />
    </div>
  );
}
