import QuotationRowActions from "../components/QuotationRowActions";
import { formatDateOnly } from "@/shared/utils/formatDate";

export const quotationColumns = (onChanged) => [
  {
    // El nombre de una cotización ES el de su archivo: no hay otro campo que
    // escribir, y el nombre generado en disco (con su sufijo aleatorio para
    // evitar colisiones) no le diría nada a nadie.
    accessorKey: "fileName",
    header: "Nombre",
  },
  {
    id: "cargadaPor",
    header: "Cargada por",
    accessorFn: (row) =>
      row.uploader ? `${row.uploader.userFirstName} ${row.uploader.userLastName}` : "—",
  },
  {
    id: "materiales",
    header: "Materiales",
    // accessorFn devolviendo texto: un número crudo no entra en el buscador
    // global de la tabla.
    accessorFn: (row) => String(row._count?.materials ?? 0),
  },
  {
    id: "fechaCarga",
    header: "Fecha de carga",
    accessorFn: (row) => formatDateOnly(row.created_at),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <QuotationRowActions quotation={row.original} onChanged={onChanged} />
    ),
  },
];
