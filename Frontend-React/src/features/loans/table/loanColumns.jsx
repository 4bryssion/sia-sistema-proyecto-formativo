import { Switch } from "@/shared";
import LoanRowActions from "../components/LoanRowActions";
import loanService from "../services/loanService";
import { getLoanStatusLabel } from "../utils/loanStatusLabel";

const partyName = (loan, party) => {
  const sig = loan.signatures?.find((s) => s.party === party);
  return sig?.user ? `${sig.user.userFirstName} ${sig.user.userLastName}` : "—";
};

const materialsLabel = (loan) => {
  const mats = loan.materials ?? [];
  if (!mats.length) return "—";
  return mats
    .map((m) => `${m.consumableMaterial?.materialName ?? "?"} (${m.borrowedQuantity})`)
    .join(", ");
};

export const loanColumns = (refetch) => [
  // Columna identificador del préstamo
    {
        accessorKey: "id",
        header: "ID",

        // Cambio: doble clic en el id navega a visualizar el préstamo
        // según observación del instructor, para evitar redirecciones accidentales
        cell: ({ row }) => {
            const loan = row.original;

            const handleDoubleClick = () => {
                window.location.href = `/view/loans/${loan.id}`;
            };

            return (
                <span
                    onDoubleClick={handleDoubleClick}
                    className="cursor-pointer hover:underline"
                >
                    {loan.id}
                </span>
            );
        },
    },    
  { id: "receiver", header: "Usuario solicitante", cell: ({ row }) => partyName(row.original, "Receptor") },
  { id: "lender",   header: "Aprobado por",        cell: ({ row }) => partyName(row.original, "Prestador") },
  { id: "materials", header: "Materiales",          cell: ({ row }) => materialsLabel(row.original) },
  { accessorKey: "apprenticeGroup", header: "Grupo" },
  {
    id: "returnDate",
    header: "Fecha devolución",
    cell: ({ row }) => (row.original.returnDate ? String(row.original.returnDate).slice(0, 10) : "—"),
  },
  { id: "status", header: "Estado", cell: ({ row }) => getLoanStatusLabel(row.original.status) },
  {
    accessorKey: "isActive",
    header: "Activo",
    cell: ({ row }) => {
      const loan = row.original;
      const handleToggle = async () => {
        try {
          await loanService.toggle(loan.id);
          refetch();
        } catch (err) {
          console.error("Error al cambiar estado del préstamo:", err);
        }
      };
      return <Switch checked={loan.isActive} onChange={handleToggle} className="inline-flex" />;
    },
  },
  { id: "actions", cell: ({ row }) => <LoanRowActions loan={row.original} /> },
];
