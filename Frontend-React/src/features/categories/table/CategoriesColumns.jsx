import CategoryRowActions from "../components/CategoryRowActions";

export const categoryColumns = (onChanged) => [
  // Sin columna de ID: el registro se identifica por su nombre; el id solo
  // viaja internamente para abrir el modal o llamar al servicio.
  {
    accessorKey: "categoryName",
    header: "Nombre",
  },
  {
    id: "dimensiones",
    header: "Pide dimensiones",
    // accessorFn y no accessorKey: la tabla busca sobre TEXTO, y un booleano
    // crudo no se puede buscar ni leer. Devolver "Sí"/"No" hace que la columna
    // entre en el buscador global como cualquier otra.
    accessorFn: (row) => (row.requiresDimensions ? "Sí" : "No"),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <CategoryRowActions category={row.original} onChanged={onChanged} />
    ),
  },
];
