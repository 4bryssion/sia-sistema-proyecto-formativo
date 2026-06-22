import GroupRowActions from "../components/GroupRowActions";

// Definición de columnas de la tabla de grupos
export const groupColumns = [

    // Columna ID
    {
        accessorKey: "id",
        header: "Id",
    },

    // Columna Nombre del grupo
    {
        accessorKey: "nombre_grupo",
        header: "Nombre del grupo",
    },

    // Columna Usuarios
    {
        accessorKey: "usuarios",
        header: "Usuarios",
    },

    // Columna Permisos
    {
        accessorKey: "permisos",
        header: "Permisos",
    },

    // Columna de acciones
    {
        id: "actions",
        cell: ({ row }) => <GroupRowActions group={row.original} />,
    },
];