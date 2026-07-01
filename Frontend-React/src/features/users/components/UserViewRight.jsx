import { Input, Button } from "@/shared";
import { Pencil } from "lucide-react";
import logo from "@/assets/logos/logo-sena-negro.png";
import { useNavigate } from "react-router-dom";
import { getTopGroupName } from "../utils/topGroup";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO") : "—");
const fmtDateOnly = (d) =>
  d ? new Date(d).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—";

export default function UserViewRight({ user }) {
  const navigate = useNavigate();
  const fullName =
    `${user?.userFirstName ?? ""} ${user?.userLastName ?? ""}`.trim();

  return (
    <div className="relative">
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Usuario
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="grid gap-2 justify-items-center">
          <Input label="Nombre" value={fullName} disabled />
          <Input
            label="Tipo de documento"
            value={user?.documentType?.documentName ?? ""}
            disabled
          />
          <Input
            label="Número de documento"
            value={user?.userDocumentNumber ?? ""}
            disabled
          />
          <Input
            label="Estado"
            value={user?.isActive ? "Activo" : "Inactivo"}
            disabled
          />
          <Input label="Teléfono" value={user?.userPhone ?? ""} disabled />
          <Input
            label="Teléfono secundario"
            value={user?.userSecondPhone ?? ""}
            disabled
          />
          <Input
            label="Rol del usuario"
            value={getTopGroupName(user)}
            disabled
          />
        </div>

        <div className="grid gap-2 justify-items-center lg:h-max">
          <Input
            label="Tipo de cuenta"
            value={user?.userAccountType ?? ""}
            disabled
          />
          <Input
            label="Fecha de inicio"
            value={fmtDate(user?.createdAt)}
            disabled
          />
          <Input
            label="Fecha de finalización"
            value={fmtDateOnly(user?.userEndDate)}
            disabled
          />
          <Input
            label="Correo personal"
            value={user?.userEmail ?? ""}
            disabled
          />
          <Input
            label="Correo institucional"
            value={user?.userEmailInstitutional ?? ""}
            disabled
          />
          <Input label="Dirección" value={user?.userAddress ?? ""} disabled />
        </div>
      </div>

      <div className="grid gap-6 mt-6 sm:flex sm:w-80 sm:mx-auto lg:justify-end justify-center lg:flex lg:w-full">
        <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          onClick={() => navigate(`/view/users/${user.id}/edit`)}
        >
          <Pencil size={16} />
          Editar
        </Button>
      </div>

      <img
        src={logo}
        alt="Logo SENA"
        className="absolute right-0 -bottom-3 w-16"
      />
    </div>
  );
}
