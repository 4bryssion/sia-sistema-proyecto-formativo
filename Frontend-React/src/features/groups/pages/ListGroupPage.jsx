import { useState } from "react";
import { DataTable, Button, IconButton, usePermissions } from "@/shared";
import { groupColumns } from "../table/groupColumns";
import { useGroups } from "../hooks/useGroups";
import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal.jsx";

export default function ListGroupPage() {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const { groups, loading, error, refetch } = useGroups();
  // El grupo SuperAdmin no aparece como dato en ningún panel
  const visibleGroups = groups.filter((g) => g.groupName !== "SuperAdmin");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-6">

      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
            <Undo2 strokeWidth={2.8} />
          </IconButton>
          <h1 className="text-xl font-semibold mb-0 text-h3 sm:text-h2">Grupos</h1>
        </div>

        <div className="grid sm:flex gap-12 items-center">
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Crear Grupo
          </Button>
        </div>
      </div>

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
