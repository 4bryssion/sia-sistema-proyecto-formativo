import { DataTable, Button, IconButton } from "@/shared";
import { TaskColumns } from "../table/TaskColumns.jsx";
import { useTasks } from "../hooks/useTasks";
import { Link, useNavigate } from "react-router-dom";
import { Undo2 } from "lucide-react";

export default function ListTaskPage() {
  const navigate = useNavigate();
  const { tasks, loading, error, refetch } = useTasks();

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconButton ariaLabel="Devolverse" onClick={() => navigate(-1)}>
            <Undo2 strokeWidth={2.8} />
          </IconButton>
          <h1 className="text-xl font-semibold mb-0 text-h3 sm:text-h2">Tareas</h1>
        </div>

        <Link to="/dashboard/tasks/create">
          <Button variant="primary">Crear Tarea</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando tareas...</p>
      ) : error ? (
        <p className="text-error">{error}</p>
      ) : (
        <DataTable data={tasks} columns={TaskColumns(refetch)} />
      )}
    </div>
  );
}
