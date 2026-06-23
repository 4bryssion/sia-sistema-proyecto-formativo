import { TASK_STATUS_LABELS } from "../constants/taskStatus";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO") : "—");
// endDate es @db.Date (medianoche UTC): formatear en UTC para no restar un día por zona horaria
const fmtDateOnly = (d) => (d ? new Date(d).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—");

export default function TaskViewLeft({ task }) {
  return (
    <div className="font-main text-text-inverse space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full">
      <div className="grid items-center justify-center 1400:content-between">
        <h3 className="text-h3 text-center">@Tarea - {task?.taskName ?? ""}</h3>
      </div>

      <div className="grid text-center">
        <h4>Estado:</h4>
        <p>{TASK_STATUS_LABELS[task?.status] ?? "—"}</p>
      </div>

      <div className="grid text-center">
        <h4>Fecha de inicio:</h4>
        <p>{fmtDate(task?.created_at)}</p>
      </div>

      <div className="grid text-center">
        <h4>Fecha de fin:</h4>
        <p>{fmtDateOnly(task?.endDate)}</p>
      </div>
    </div>
  );
}
