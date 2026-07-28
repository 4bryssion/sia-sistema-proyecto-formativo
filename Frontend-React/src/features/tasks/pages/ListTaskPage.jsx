import { useState } from "react";
import { DataTable, Button, IconButton, usePermissions } from "@/shared";
import { TaskColumns } from "../table/TaskColumns.jsx";
import { useTasks } from "../hooks/useTasks";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Undo2 } from "lucide-react";
import CreateTaskModal from "../components/CreateTaskModal.jsx";

export default function ListTaskPage() {
  const { can } = usePermissions();
  const navigate = useNavigate();
  // ?userId=X ("Ver mis tareas" desde Mi Perfil): filtra a las tareas de ese usuario
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  // Sin permiso para listar todas las tareas, el usuario solo ve las suyas
  const ownId = JSON.parse(sessionStorage.getItem("user") ?? "null")?.id ?? null;
  const effectiveUserId = can("list_tasks") ? userId : ownId;
  const { tasks, loading, error, refetch } = useTasks(effectiveUserId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
            <Undo2 strokeWidth={2.8} />
          </IconButton>
          <h1 className="text-xl font-semibold mb-0 text-h3 sm:text-h2">
            {effectiveUserId ? "Mis Tareas" : "Tareas"}
          </h1>
        </div>

        {can("create_task") && (
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Crear Tarea
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando tareas...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : (
        <DataTable data={tasks} columns={TaskColumns(refetch)} />
      )}

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={refetch}
      />
    </div>
  );
}
