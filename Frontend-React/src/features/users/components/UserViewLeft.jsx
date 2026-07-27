import { useState } from "react";
import { Button } from "@/shared";
import { getTopGroupName } from "../utils/topGroup";
import { CreateTaskModal } from "@/features/tasks";

const API_FILES = "http://localhost:5000";
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO") : "—");
const fmtDateOnly = (d) => (d ? new Date(d).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—");

export default function UserViewLeft({ user }) {
  const fullName = `${user?.userFirstName ?? ""} ${user?.userLastName ?? ""}`.trim();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  return (
    <div className="font-main text-text-inverse space-y-6 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full">
      <div className="grid items-center gap-6 justify-center 1400:content-between">
        <img
          src={`${API_FILES}${user?.userPhoto ?? ""}`}
          alt={fullName}
          className="w-32 h-32 justify-self-center object-cover rounded"
        />
        <h3 className="text-h3 text-center">@{getTopGroupName(user)} - {fullName}</h3>
      </div>

      <div className="grid text-center">
        <h4>Estado de cuenta:</h4>
        <p>{user?.isActive ? "Activo" : "Inactivo"}</p>
      </div>

      <div className="grid text-center">
        <h4>Fecha de inicio:</h4>
        <p>{fmtDate(user?.createdAt)}</p>
      </div>

      <div className="grid text-center">
        <h4>Fecha de finalización:</h4>
        <p>{fmtDateOnly(user?.userEndDate)}</p>
      </div>

      <div className="lg:justify-self-center pl-4">
        <Button variant="primary" onClick={() => setIsTaskModalOpen(true)}>
          Asignar Tarea
        </Button>
      </div>

      {/* Modal de crear tarea con el usuario visualizado preseleccionado y bloqueado */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        assignedUser={{ id: user?.id, name: fullName }}
      />
    </div>
  );
}
