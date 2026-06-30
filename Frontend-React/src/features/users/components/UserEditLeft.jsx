import { FileInput } from "@/shared";
import { getTopGroupName } from "../utils/topGroup";

const API_FILES = "http://localhost:5000";
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO") : "—");
const fmtDateOnly = (d) => (d ? new Date(d).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—");

export default function UserEditLeft({ user, image, onImageChange }) {
  const fullName = `${user?.userFirstName ?? ""} ${user?.userLastName ?? ""}`.trim();
  //cambio de space-6 a 4
  return (
    <div className="font-main text-text-inverse space-y-4 grid sm:flex sm:space-y-0 sm:gap-6 sm:items-center sm:justify-evenly 1400:grid 1400:h-full">
      <div className="grid items-center justify-center gap-3 1400:content-between">
        {user?.userPhoto && (
          <img
            src={`${API_FILES}${user.userPhoto}`}
            alt={fullName}
            className="w-30 h-30 object-cover rounded mx-auto"
          />
        )}
        <div className="justify-self-center">
        <FileInput
          className="w-24 h-24"
          accept="image/*"
          multiple={false}
          value={image}
          onChange={onImageChange}
          children="Cambiar foto"
        />
        </div>
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
    </div>
  );
}
