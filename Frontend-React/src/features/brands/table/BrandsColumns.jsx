// Componente de acciones por fila
import BrandRowActions from "../components/BrandRowActions";

// Definición de columnas de la tabla de marcas
export const brandColumns = [
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
        cell: ({ row }) => <BrandRowActions brand={row.original} />,
    },
];