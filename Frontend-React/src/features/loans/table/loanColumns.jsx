import { Switch, Alert } from "@/shared";
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

export const loanColumns = (refetch, can = () => true, onReturn) => [
  // Sin columna de ID: el préstamo se identifica por su solicitante y su fecha;
  // el id solo viaja internamente para abrir el modal o llamar al servicio.
  { 
    id: "receiver", 
    header: "Usuario solicitante", 
    cell: ({ row }) => {
      // Cambio: doble clic en el id navega a visualizar el préstamo
      // según observación del instructor, para evitar redirecciones accidentales
      

      const loan = row.original;

      const handleDoubleClick = () => {
          window.location.href = `/view/loans/${loan.id}`;
      };

      return (
          <span
              onDoubleClick={handleDoubleClick}
              className="cursor-pointer hover:underline"
          >
              {/* {loan.id} */}
              {partyName(row.original, "Receptor")}
          </span>
      );
    },
  },
  { id: "lender",   header: "Aprobado por",        cell: ({ row }) => partyName(row.original, "Prestador") },
  { id: "materials", header: "Materiales",          cell: ({ row }) => materialsLabel(row.original) },
  { accessorKey: "apprenticeGroup", header: "Grupo" },
  {
    id: "returnDate",
    header: "Fecha devolución",
    cell: ({ row }) => (row.original.returnDate ? String(row.original.returnDate).slice(0, 10) : "—"),
  },
  {
    id: "status",
    header: "Estado",
    // El filtro por estado se movió a la barra de la tabla (FilterMenu): allí
    // recorta el array ANTES de entregarlo a DataTable, así el buscador, la
    // paginación, el contador y el reporte trabajan sobre lo ya filtrado.
    // accessorFn se conserva para que el buscador global encuentre por estado.
    accessorFn: (row) => row.status,
    cell: ({ row }) => getLoanStatusLabel(row.original.status),
  },
  {
    accessorKey: "isActive",
    header: "Activo",
    cell: ({ row }) => {
      const loan = row.original;
      const handleToggle = async () => {
        // Confirmación obligatoria antes de activar/desactivar (restaura/descuenta stock)
        const result = await Alert.warning(
          `¿${loan.isActive ? "Desactivar" : "Activar"} préstamo?`,
          loan.isActive
            ? "Se restaurará el stock de los materiales prestados."
            : "Se descontará de nuevo el stock de los materiales."
        );
        if (!result.isConfirmed) return;
        try {
          await loanService.toggle(loan.id);
          Alert.success(`Préstamo ${loan.isActive ? "desactivado" : "activado"}`);
          refetch();
        } catch (err) {
          Alert.error("Error al cambiar estado", err.response?.data?.error ?? "");
        }
      };
      // Sin permiso de toggle: solo lectura
      if (!can("toggle_loan")) return loan.isActive ? "Activo" : "Inactivo";
      return <Switch checked={loan.isActive} onChange={handleToggle} className="inline-flex" />;
    },
  },
  { id: "actions", cell: ({ row }) => <LoanRowActions loan={row.original} onReturn={onReturn} /> },
];
