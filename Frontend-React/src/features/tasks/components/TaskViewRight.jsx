import { Input, Button } from "@/shared";
import { Pencil } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import { useNavigate } from "react-router-dom";
import { TASK_STATUS_LABELS } from "../constants/taskStatus";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO") : "—");
// endDate es @db.Date (medianoche UTC): formatear en UTC para no restar un día por zona horaria
const fmtDateOnly = (d) => (d ? new Date(d).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—");

export default function TaskViewRight({ task }) {
  const navigate = useNavigate();
  const assignee = task?.user
    ? `${task.user.userFirstName} ${task.user.userLastName}`
    : "—";

  return (
    <div className="relative">
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Tarea
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-6 justify-items-center">
          <Input label="Título de la tarea" value={task?.taskName ?? ""} disabled />
          <Input label="Descripción de la tarea" value={task?.description ?? ""} disabled />
          <Input label="Estado" value={TASK_STATUS_LABELS[task?.status] ?? ""} disabled />
        </div>

        <div className="grid gap-6 justify-items-center lg:h-max">
          <Input label="Usuario asignado" value={assignee} disabled />
          <Input label="Fecha de inicio" value={fmtDate(task?.created_at)} disabled />
          <Input label="Fecha de fin" value={fmtDateOnly(task?.endDate)} disabled />
        </div>
      </div>

      <div className="grid gap-6 mt-6 sm:flex sm:w-80 sm:mx-auto sm:justify-end lg:flex lg:w-full">
        <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          onClick={() => navigate(`/view/tasks/${task.id}/edit`)}
        >
          <Pencil size={16} />
          Editar
        </Button>
      </div>

      <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
    </div>
  );
}
