import TaskRowActions from "../components/TaskRowActions";
import { TASK_STATUS_LABELS } from "../constants/taskStatus";

export const TaskColumns = (onChanged) => [
  { accessorKey: "id", header: "Id" },
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
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => <TaskRowActions tasks={row.original} onChanged={onChanged} />,
  },
];
