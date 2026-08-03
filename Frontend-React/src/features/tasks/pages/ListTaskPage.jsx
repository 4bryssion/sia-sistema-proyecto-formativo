import { useState } from "react";
import { DataTable, Button, usePermissions , ListPageHeader } from "@/shared";
import { TaskColumns } from "../table/TaskColumns.jsx";
import { useTasks } from "../hooks/useTasks";
import { useSearchParams } from "react-router-dom";
import CreateTaskModal from "../components/CreateTaskModal.jsx";
import ReportConfigModal from "../reports/components/ReportConfigModal.jsx";

export default function ListTaskPage() {
  const { can } = usePermissions();
  // ?userId=X ("Ver mis tareas" desde Mi Perfil): filtra a las tareas de ese usuario
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  // Sin permiso para listar todas las tareas, el usuario solo ve las suyas
  const ownId = JSON.parse(sessionStorage.getItem("user") ?? "null")?.id ?? null;
  const effectiveUserId = can("list_tasks") ? userId : ownId;
  const { tasks, loading, error, refetch } = useTasks(effectiveUserId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <div className="p-6">
      <ListPageHeader title={effectiveUserId ? "Mis Tareas" : "Tareas"}>
        <Button variant="secondary" onClick={() => setIsReportOpen(true)}>
          Generar Reporte
        </Button>

        {can("create_task") && (
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            Crear Tarea
          </Button>
        )}
      </ListPageHeader>

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

      <ReportConfigModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        tasks={tasks}
      />
    </div>
  );
}
