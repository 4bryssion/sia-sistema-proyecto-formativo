import { Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared";
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
      <h2 className="font-main text-h2 text-center font-bold mb-6 1400:text-start">Préstamo</h2>

      <div className="grid lg:grid-cols-2 gap-6 w-full font-main">
        <div className="grid gap-3">
          <p><strong>Grupo de aprendices:</strong> {loan?.apprenticeGroup ?? "—"}</p>
          <p><strong>Justificación de uso:</strong> {loan?.useJustification ?? "—"}</p>
          <p><strong>Prestador:</strong> {partyLine(lender)}</p>
          <p><strong>Receptor:</strong> {partyLine(receiver)}</p>
        </div>

        <div className="grid gap-2">
          <strong>Materiales prestados:</strong>
          <ul className="list-disc ml-5">
            {(loan?.materials ?? []).map((m) => (
              <li key={m.materialId}>
                {m.consumableMaterial?.materialName ?? `#${m.materialId}`} — cantidad {m.borrowedQuantity}
              </li>
            ))}
            {(loan?.materials ?? []).length === 0 && <li>—</li>}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-2 lg:gap-6 lg:w-full">
        <div className="lg:w-[320px] lg:justify-self-center">
          <Button
            variant="toggle"
            activeLabel="Activo"
            inactiveLabel="Desactivado"
            checked={loan?.isActive}
            disabled={toggling}
            onClick={handleToggle}
          />
        </div>

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
