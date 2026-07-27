import { useState } from "react";
import { DataTable, Button, IconButton } from "@/shared";
import { TaskColumns } from "../table/TaskColumns.jsx";
import { useTasks } from "../hooks/useTasks";
import { useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";
import CreateTaskModal from "../components/CreateTaskModal.jsx";

export default function ListTaskPage() {
  const navigate = useNavigate();
  const { tasks, loading, error, refetch } = useTasks();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
            <Undo2 strokeWidth={2.8} />
          </IconButton>
          <h1 className="text-xl font-semibold mb-0 text-h3 sm:text-h2">Tareas</h1>
        </div>

        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          Crear Tarea
        </Button>
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
