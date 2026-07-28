import { Switch, Dropdown, DropdownTrigger, DropdownContent, DropdownItem, Alert } from "@/shared";
import { ListFilter } from "lucide-react";
import LoanRowActions from "../components/LoanRowActions";
import loanService from "../services/loanService";
import { getLoanStatusLabel } from "../utils/loanStatusLabel";

// Estados del préstamo para el filtro del header (enum LoanStatus)
const STATUS_OPTIONS = ["Pendiente_confirmacion", "Activo", "Finalizado"];

// Header de "Estado" con icono de filtro: mismo patrón que materiales — usa el
// Dropdown compartido; su contenido va en portal fixed y se superpone a la tabla
function StatusFilterHeader({ column }) {
  const current = column.getFilterValue();

  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          type="button"
          className="flex items-center gap-1 cursor-pointer hover:opacity-70"
          aria-label="Filtrar por estado"
        >
          Estado
          <ListFilter size={16} className={current ? "text-primary" : ""} />
        </button>
      </DropdownTrigger>

      {/* w-56 fijo: "Pendiente de confirmación" necesita más ancho que el w-48 de materiales */}
      <DropdownContent className="w-56">
        <DropdownItem
          onClick={() => column.setFilterValue(undefined)}
          className={!current ? "font-semibold" : ""}
        >
          Todos
        </DropdownItem>
        {STATUS_OPTIONS.map((s) => (
          <DropdownItem
            key={s}
            onClick={() => column.setFilterValue(s)}
            className={current === s ? "font-semibold" : ""}
          >
            {getLoanStatusLabel(s)}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}

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

export const loanColumns = (refetch, can = () => true) => [
  // Columna identificador del préstamo
  // {
  //     accessorKey: "id",
  //     header: "ID",
  // },    
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
    // accessorFn + filterFn "equals" habilitan el filtro por columna del header
    accessorFn: (row) => row.status,
    filterFn: "equals",
    header: ({ column }) => <StatusFilterHeader column={column} />,
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
  { id: "actions", cell: ({ row }) => <LoanRowActions loan={row.original} /> },
];
