// Componente de acciones por fila
import BrandRowActionsView from "../components/BrandRowActionsView";

// Definición de columnas de la tabla de marcas
export const brandColumnsView = [
    {
        accessorKey: "id",
        header: "Id",
    },
    {
        accessorKey: "nombre",
        header: "Nombre",
    },
    {
        id: "actions",
        cell: ({ row }) => <BrandRowActionsView brand={row.original} />,
    },
];