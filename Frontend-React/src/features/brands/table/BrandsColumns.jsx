import BrandRowActions from "../components/BrandRowActions";

export const brandColumns = (onChanged) => [
  // Sin columna de ID: el registro se identifica por su nombre; el id solo
  // viaja internamente para abrir el modal o llamar al servicio.
    {
        accessorKey: "brandName",
        header: "Nombre",
    },
    {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
            <BrandRowActions brand={row.original} onChanged={onChanged} />
        ),
    },
];
