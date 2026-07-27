import BrandRowActions from "../components/BrandRowActions";

export const brandColumns = (onChanged) => [
    // {
    //     accessorKey: "id",
    //     header: "Id",
    // },
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
