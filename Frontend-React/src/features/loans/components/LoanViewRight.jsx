import { Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@/shared";
import logo from "@/assets/logos/logo-sena-negro.png";

// El toggle de activo/inactivo se eliminó de esta pantalla: se gestiona solo
// desde el Switch de la tabla de listar préstamos
export default function LoanViewRight({ loan }) {
  const navigate = useNavigate();
  const canEdit = loan?.status === "Activo";
  const lender = loan?.signatures?.find((s) => s.party === "Prestador");
  const receiver = loan?.signatures?.find((s) => s.party === "Receptor");

  const partyLine = (sig) =>
    sig?.user
      ? `${sig.user.userFirstName} ${sig.user.userLastName} — ${sig.signed ? "Firmado" : "Sin firmar"}`
      : "—";

  return (
    <div className="relative">
      <div className="mb-6 1400:grid 1400:grid-cols-2 1400:gap-6">
        <h2 className="font-main text-h2 text-center font-bold 1400:text-start 1400:justify-self-center 1400:w-[320px]">
          Préstamo
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        {/* Columna izquierda */}
        <div className="grid gap-6 justify-items-center">
          {/* El max-width solo aplica desde sm (640px), antes de eso el Input ocupa todo el ancho */}
          <Input
            className="sm:max-w-[320px]"
            label="Grupo de aprendices"
            value={loan?.apprenticeGroup ?? "—"}
            readOnly
          />

          <Input
            className="sm:max-w-[320px]"
            label="Justificación de uso"
            value={loan?.useJustification ?? "—"}
            readOnly
          />

          <Input
            className="sm:max-w-[320px]"
            label="Prestador"
            value={partyLine(lender)}
            readOnly
          />

          <Input
            className="sm:max-w-[320px]"
            label="Receptor"
            value={partyLine(receiver)}
            readOnly
          />
        </div>

        {/* Columna derecha */}
        <div className="grid gap-6 lg:h-max md:justify-items-center md:items-start md:mx-auto">
          <strong className="justify-self-start">Materiales prestados:</strong>

          <ul className="list-disc ml-5 w-full">
            {(loan?.materials ?? []).map((m) => (
              <li key={m.materialId}>
                {m.consumableMaterial?.materialName ?? `#${m.materialId}`} — cantidad {m.borrowedQuantity}
              </li>
            ))}
            {(loan?.materials ?? []).length === 0 && <li>—</li>}
          </ul>
        </div>
      </div>

      {/* Acciones + Logo */}
      <div className="flex flex-wrap items-center justify-end gap-6 mt-6">
        <div className="flex flex-wrap justify-end gap-3 flex-1 min-w-0">
          <Button
            variant="primary"
            className="gap-2"
            disabled={!canEdit}
            title={
              canEdit
                ? "Editar préstamo"
                : "Solo préstamos en estado Activo pueden editarse"
            }
            onClick={() => canEdit && navigate(`/view/loans/${loan.id}/edit`)}
          >
            <Pencil size={16} />
            Editar
          </Button>
        </div>

        <img
          src={logo}
          alt="Logo SENA"
          className="w-16 shrink-0"
        />
      </div>
    </div>
  );
}