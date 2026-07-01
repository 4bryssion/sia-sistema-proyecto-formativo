import { Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@/shared";
import loanService from "../services/loanService";
import logo from "@/assets/logos/logo-sena-negro.png";

export default function LoanViewRight({ loan, onToggled }) {
  const navigate = useNavigate();
  const [toggling, setToggling] = useState(false);
  const canEdit = loan?.status === "Activo";
  const lender   = loan?.signatures?.find((s) => s.party === "Prestador");
  const receiver = loan?.signatures?.find((s) => s.party === "Receptor");

  const partyLine = (sig) =>
    sig?.user
      ? `${sig.user.userFirstName} ${sig.user.userLastName} — ${sig.signed ? "Firmado" : "Sin firmar"}`
      : "—";

  const handleToggle = async () => {
    setToggling(true);
    try {
      await loanService.toggle(loan.id);
      onToggled?.();
    } catch (err) {
      alert(err.response?.data?.error ?? "Error al cambiar estado");
    } finally {
      setToggling(false);
    }
  };

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
          <Input label="Grupo de aprendices" value={loan?.apprenticeGroup ?? "—"} readOnly />
          <Input label="Justificación de uso" value={loan?.useJustification ?? "—"} readOnly />
          <Input label="Prestador" value={partyLine(lender)} readOnly />
          <Input label="Receptor" value={partyLine(receiver)} readOnly />
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

      {/* Botones al final */}
      <div className="grid gap-6 mt-6 sm:flex sm:justify-center md:justify-end lg:flex lg:w-full">
        <Button
          variant="toggle"
          activeLabel="Activo"
          inactiveLabel="Desactivado"
          checked={loan?.isActive}
          disabled={toggling}
          onClick={handleToggle}
        />
         <Button
          variant="primary"
          className="gap-2 lg:justify-self-end lg:mr-24"
          disabled={!canEdit}
          title={canEdit ? "Editar préstamo" : "Solo préstamos en estado Activo pueden editarse"}
          onClick={() => canEdit && navigate(`/view/loans/${loan.id}/edit`)}
        >
          <Pencil size={16} />
          Editar
        </Button>
      </div>

      <img src={logo} alt="Logo SENA" className="absolute right-0 bottom-0 w-16" />
    </div>
  );
}
