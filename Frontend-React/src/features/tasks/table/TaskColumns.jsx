import { Checkbox } from "@/shared";
import TaskRowActions from "../components/TaskRowActions";
import { TASK_STATUS_LABELS } from "../constants/taskStatus";
import taskService from "../services/taskService"; // ajusta según el export real
import { useState } from "react";

function StatusCheckboxCell({ task, onChanged }) {
  const [busy, setBusy] = useState(false);

  const isCompleted = task.status === "completada";
  const isFailed = task.status === "no_completada";

  const handleStatus = async () => {
    if (isFailed) return;
    setBusy(true);
    try {
      await taskService.update(task.id, {
        status: isCompleted ? "en_progreso" : "completada",
      });
      onChanged?.();
    } catch {
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={isCompleted}
        disabled={isFailed || busy}
        onChange={handleStatus}
      />
      <span>{TASK_STATUS_LABELS[task.status] ?? task.status}</span>
    </div>
  );
}

export const TaskColumns = (onChanged) => [
  // { accessorKey: "id", header: "Id" },
  { accessorKey: "taskName", header: "Título" },
  { accessorKey: "description", header: "Descripción" },
  {
    id: "assignee",
    header: "Encargado",
    accessorFn: (row) =>
      row.user ? `${row.user.userFirstName} ${row.user.userLastName}` : "—",
  },
  {
    id: "estado",
    header: "Estado",
    accessorFn: (row) => TASK_STATUS_LABELS[row.status] ?? row.status,
    cell: ({ row }) => (
      <StatusCheckboxCell task={row.original} onChanged={onChanged} />
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <TaskRowActions tasks={row.original} onChanged={onChanged} />,
  },
];