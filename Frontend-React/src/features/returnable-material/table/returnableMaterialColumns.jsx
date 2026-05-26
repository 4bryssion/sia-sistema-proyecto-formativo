import { Switch } from "@/shared";

// Componente que contiene los botones de acciones (editar, entre otras) para cada material retornable
import ReturnableMaterialRowActions from "../components/ReturnableMaterialRowActions";

// Definición de las columnas de la tabla de material retornable
// Este arreglo suele usarse en librerías de tablas como TanStack Table
export const returnableMaterialColumns = [

    // Columna ID
    {
    accessorKey: "id", // Propiedad del objeto material retornable que se mostrará en la columna
    header: "Id",      // Título de la columna
    },

    // Columna Nombre
    {
    accessorKey: "nombre_material", // Campo del objeto material retornable
    header: "Nombre",    // Encabezado visible
    },

    // Columna cuentadante
    {
    accessorKey: "cuentadante",
    header: "Cuentadante",
    },

    // Columna estado
    {
    accessorKey: "estado",
    header: "Estado",
    },

    // Columna Estado (activo / inactivo)
    {
    accessorKey: "is_active",
    header: "Activo",


    // Render personalizado de la celda
    // Permite mostrar un componente en lugar de solo texto
    cell: ({ row }) => {

        // Se obtiene el objeto completo del material retornable de la fila
        const returnableMaterial = row.original;

        // Función que se ejecuta cuando cambia el switch
        const handleChange = (value) => {

            // value representa el nuevo estado del switch (true o false)
            console.log("Actualizar estado material retornable:", returnableMaterial.returnableMaterial_id, value);

            // Aquí normalmente se llamaría una API para actualizar el estado
            // updateUserStatus(user.user_id, value)
        };

        return (
            // Componente reutilizable para mostrar el switch
            <Switch
                checked={returnableMaterial.is_active} // Estado actual del usuario
                onChange={handleChange}  // Función que maneja el cambio
                className="inline-flex"
            />
        );
    },
    },


    // Columna de acciones (editar / eliminar)
    {
        id: "actions", // No usa accessorKey porque no corresponde a un campo del material retornable


        // Renderiza el componente de acciones pasando el material retornable completo
        cell: ({ row }) => <ReturnableMaterialRowActions returnableMaterial={row.original} />,
    },
];
