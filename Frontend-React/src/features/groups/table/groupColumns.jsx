import GroupRowActions from "../components/GroupRowActions";

export const groupColumns = (onChanged) => [
  // Sin columna de ID: el registro se identifica por su nombre; el id solo
  // viaja internamente para abrir el modal o llamar al servicio.
  {
    accessorKey: "groupName",
    header: "Nombre del grupo",
  },
  {
    id: "usuarios",
    header: "Usuarios",
    accessorFn: (row) => row._count?.users ?? 0,
  },
  {
    id: "permisos",
    header: "Permisos",
    accessorFn: (row) => row._count?.permissions ?? 0,
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <GroupRowActions group={row.original} onChanged={onChanged} />
    ),
  },
];
