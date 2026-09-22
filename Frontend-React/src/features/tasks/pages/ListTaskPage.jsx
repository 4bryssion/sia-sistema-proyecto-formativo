import { useState } from "react";
import {
  DataTable, Button, FilterMenu, ListPageHeader, StatusFilterSelect,
  usePermissions, getCurrentUser,
} from "@/shared";
import CreateTaskModal from "@/shared/components/tasks/CreateTaskModal";
import { TaskColumns } from "../table/TaskColumns.jsx";
import { useTasks } from "../hooks/useTasks";
import { TASK_STATUS_OPTIONS } from "../constants/taskStatus";
import ViewTaskModal from "../components/ViewTaskModal.jsx";
import EditTaskModal from "../components/EditTaskModal.jsx";
import ReportConfigModal from "../reports/components/ReportConfigModal.jsx";

export default function ListTaskPage() {
  const { can } = usePermissions();

  // (p50) Se eliminó el filtro por ?userId= de la URL: era el que usaba "Ver mis
  // tareas" desde Mi Perfil, función que ahora lleva a notificaciones. Lo que
  // queda es la regla de permisos, que no depende de la URL: sin permiso para
  // listar todas, cada quien ve únicamente las suyas.
  const verTodas = can("list_tasks");
  const ownId = getCurrentUser()?.id ?? null;
  const effectiveUserId = verTodas ? null : ownId;

  // Estado del REGISTRO (activo/inactivo). Solo tiene sentido para quien ve
  // todas: a quien solo ve las suyas el backend ya le entrega las activas.
  const [status, setStatus] = useState("active");
  // Estado de la TAREA. Se filtra sobre los datos ya cargados, igual que el tipo
  // de usuario en el listado de usuarios: así el buscador, la paginación y el
  // contador trabajan sobre el conjunto ya filtrado.
  const [taskStatus, setTaskStatus] = useState(undefined);

  const { tasks, loading, error, refetch } = useTasks(effectiveUserId, status);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  // Una sola instancia de cada modal para toda la tabla: las filas solo dicen
  // qué id abrir.
  const [viewTaskId, setViewTaskId] = useState(null);
  const [editTaskId, setEditTaskId] = useState(null);

  const visibles = tasks.filter((t) => !taskStatus || t.status === taskStatus);

  return (
    <div className="p-6">
      <ListPageHeader title={verTodas ? "Tareas" : "Mis Tareas"}>
        {verTodas && <StatusFilterSelect value={status} onChange={setStatus} />}

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
        <DataTable
          data={visibles}
          columns={TaskColumns(refetch, setViewTaskId, setEditTaskId)}
          toolbarExtra={
            <FilterMenu
              label="Estado de la tarea"
              value={taskStatus}
              onChange={setTaskStatus}
              options={TASK_STATUS_OPTIONS}
            />
          }
        />
      )}

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={refetch}
      />

      <ReportConfigModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        tasks={visibles}
      />

      <ViewTaskModal
        isOpen={viewTaskId != null}
        taskId={viewTaskId}
        onClose={() => setViewTaskId(null)}
        // Editar desde el modal de consulta: se cierra uno y se abre el otro
        onEdit={(id) => { setViewTaskId(null); setEditTaskId(id); }}
      />

      <EditTaskModal
        isOpen={editTaskId != null}
        taskId={editTaskId}
        onClose={() => setEditTaskId(null)}
        onSaved={refetch}
      />
    </div>
  );
}
