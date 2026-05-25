import { Switch } from "@/shared";

// Componente que contiene los botones de acciones (editar, entre otras) para cada usuario
import UserRowActions from "../components/UserRowActions";

// Definición de las columnas de la tabla de usuarios
// Este arreglo suele usarse en librerías de tablas como TanStack Table
export const UserColumns = [

    // Columna ID
    {
    accessorKey: "id", // Propiedad del objeto material consumible que se mostrará en la columna
    header: "Id",      // Título de la columna
    },

    // Columna Nombre
    {
    accessorKey: "nombre", // Campo del objeto material consumible
    header: "Nombre",    // Encabezado visible
    },

    // Columna Tipo de usuario
    {
    accessorKey: "rol",
    header: "Tipo de usuario",
    },

    // Columna Fecha de finalización
    {
    accessorKey: "fecha_finalizacion",
    header: "Fecha de finalización",
    },

    // Columna Estado (activo / inactivo)
    {
    accessorKey: "is_active",
    header: "Activo",

    // Render personalizado de la celda
    // Permite mostrar un componente en lugar de solo texto
    cell: ({ row }) => {

        // Se obtiene el objeto completo del usuario de la fila
        const users = row.original;

        // Función que se ejecuta cuando cambia el switch
        const handleChange = (value) => {

            // value representa el nuevo estado del switch (true o false)
            console.log("Actualizar estado usuarios:", users.users_id, value);

            // Aquí normalmente se llamaría una API para actualizar el estado
            // updateUserStatus(user.user_id, value)
        };

        return (
            // Componente reutilizable para mostrar el switch
            <Switch
                checked={users.is_active} // Estado actual del usuario
                onChange={handleChange}  // Función que maneja el cambio
                className="inline-flex"
            />
        );
    },
    },


    // Columna de acciones (editar / eliminar)
    {
        id: "actions", // No usa accessorKey porque no corresponde a un campo del usuario


        // Renderiza el componente de acciones pasando el usuario completo
        cell: ({ row }) => <UserRowActions users={row.original} />,
    },
];
