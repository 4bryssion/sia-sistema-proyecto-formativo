// Componente que contiene los botones de acciones de cada préstamo
import LoanRowActions from "../components/LoanRowActions";

import { Switch } from "@/shared";

// Definición de las columnas de la tabla de préstamos
// Este arreglo se utiliza para configurar las columnas de la tabla
export const loanColumns = [

    // Columna identificador del préstamo
    {
        accessorKey: "id",
        header: "Id",
    },

    // Columna usuario solicitante
    {
        accessorKey: "usuario",
        header: "Usuario",
    },

    // Columna material prestado
    {
        accessorKey: "material",
        header: "Material",
    },

    // Columna grupo de aprendices asociado al préstamo
    {
        accessorKey: "grupo_aprendices",
        header: "Grupo",
    },

    // Columna fecha de devolución del material
    {
        accessorKey: "fecha_devolucion",
        header: "Fecha devolución",
    },

    // Columna estado del préstamo (activo / inactivo)
    {
        accessorKey: "is_active",
        header: "Activo",

        // Render personalizado para mostrar un switch
        cell: ({ row }) => {

            // Se obtiene el objeto completo del préstamo de la fila
            const loan = row.original;

            // Función ejecutada cuando cambia el estado del switch
            const handleChange = (value) => {

                // value representa el nuevo estado (true / false)
                console.log(
                    "Actualizar estado préstamo:",
                    loan.loan_id,
                    value
                );

                // Aquí normalmente se consumiría la API
                // updateLoanStatus(loan.loan_id, value)
            };

            return (
                // Componente reutilizable para cambiar el estado
                <Switch
                    checked={loan.is_active} // Estado actual del préstamo
                    onChange={handleChange}  // Manejo del cambio de estado
                    className="inline-flex"
                />
            );
        },
    },

    // Columna acciones (editar, eliminar, opciones, etc.)
    {
        id: "actions",

        // Renderiza el componente de acciones pasando el préstamo completo
        cell: ({ row }) => (
            <LoanRowActions loan={row.original} />
        ),
    },
];