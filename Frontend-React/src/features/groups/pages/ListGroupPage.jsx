import { useState } from "react";
import { DataTable, Button, IconButton } from "@/shared";
import { groupColumns } from "../table/groupColumns";
import { useGroups } from "../hooks/useGroups";
import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal.jsx";

export default function ListGroupPage() {
  const navigate = useNavigate();
  const { groups, loading, error, refetch } = useGroups();
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
        <DataTable data={groups} columns={groupColumns(refetch)} />
      )}

      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={refetch}
      />
    </div>
  );
}
