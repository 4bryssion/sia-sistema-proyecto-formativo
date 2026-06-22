import { Select } from "@/shared";

// Componente que contiene los botones de acciones (editar, entre otras) para cada usuario
import TaskRowActions from "../components/TaskRowActions";

// Definición de las columnas de la tabla de usuarios
// Este arreglo suele usarse en librerías de tablas como TanStack Table
export const TaskColumns = [

    // Columna ID
    {
    accessorKey: "id", // Propiedad del objeto material consumible que se mostrará en la columna
    header: "Id",      // Título de la columna
    },

    // Columna Nombre
    {
    accessorKey: "titulo", // Campo del objeto material consumible
    header: "Título",    // Encabezado visible
    },

    // Columna descripcion
    {
    accessorKey: "descripcion",
    header: "Descipción",
    },

    // Columna Fecha de finalización
    {
    accessorKey: "usuario_asignado",
    header: "Encargado",
    },

    {
		accessorKey: "estado",
		header: "Estado",

	},



    // Columna de acciones (editar / eliminar)
    {
        id: "actions", // No usa accessorKey porque no corresponde a un campo del usuario


        // Renderiza el componente de acciones pasando el usuario completo
        cell: ({ row }) => <TaskRowActions tasks={row.original} />,
    },
];
