import { createBrowserRouter, Navigate } from "react-router-dom";

// Import componentes:

import {  
    DashboardLayout

} from "@/shared"

// Import pages

// Módulo home:
import { HomePage } from "@/features/home"

// Módulo auth:

// Módulo users:

// Módulo consumable-materials:
import { ListConsumableMaterialPage, CreateConsumablesMaterialPage } from "@/features/consumable-material";

// Módulo returnable-materials:

// Módulo loans:

// Módulo brands:

// Módulo groups:

const router = createBrowserRouter([
    // {
    //     path: "/",
    //     element: <Navigate to="auth" replace />
    // },
    // {
    //     path: "/auth",
    //     element: <AuthLayout />,
    //     children: [
    //         {
    //             index: true
    //         }
    //     ],
    // },
    {
        path: "/",
        element: <DashboardLayout />,
        children: [
            // Este modulo de alert-history aún estamos en duda de si realizarlo o no.
            {
                path: "alert-history",
                element: <h1>Historial de alertas del sistema en general</h1>
            },
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "users",
                element: <h1>Usuarios</h1>
            },

            // Módulo de materiales consumibles:
            {
                path: "consumable-materials",
                element: <ListConsumableMaterialPage />,
            },
            {
                path: "consumable-materials/create",
                element: <CreateConsumablesMaterialPage />,
            },

            // Módulo de materiales devolutivos:
            {
                path: "returnable-materials",
                element: <h1>Materiales devolutivos</h1>
            },
            {
                path: "loans",
                element: <h1>Prestamos</h1>
            },
            {
                path: "configuration",
                element: <h1>Configuración "Marcas y Grupos"</h1>
            },
        ],
    },
    // Rutas de editar, como rompen el layout de dashboard por el navbar. Se manejaran fuera de la ruta de dashboard.
    {
        path: "consumable-materials/edit/:id",
        element: <h1>Editar material consumible</h1>,
    },
]);

export default router;