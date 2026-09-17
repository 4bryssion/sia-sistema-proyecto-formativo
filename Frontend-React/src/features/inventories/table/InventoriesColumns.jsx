import InventoryRowActions from "../components/InventoryRowActions";

export const inventoryColumns = (onChanged) => [
  // Sin columna de ID: el registro se identifica por su nombre; el id solo
  // viaja internamente para abrir el modal o llamar al servicio.
    {
        accessorKey: "inventoryName",
        header: "Nombre",
    },
    {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
            <InventoryRowActions inventory={row.original} onChanged={onChanged} />
        ),
    },
];
