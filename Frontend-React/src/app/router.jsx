import { createBrowserRouter, Navigate } from "react-router-dom";

// Import componentes:

import {  
    DashboardLayout,
    ViewLayout

} from "@/shared"

// Import pages

// Módulo home:
import { HomePage } from "@/features/home"

// Módulo auth:


// Módulo users:
import { 
    ListUserPage, 
    CreateUserPage,
    ViewUserPage 

} from "@/features/users";


// Módulo consumable-materials:
import { 
    ListConsumableMaterialPage, CreateConsumablesMaterialPage,
    ViewConsumableMaterialPage 
    
} from "@/features/consumable-material";


// Módulo returnable-materials:
import { 
    ListReturnableMaterialPage,
    CreateReturnableMaterialPage
    
} from "@/features/returnable-material";

// Módulo loans:
import { 
    ListLoanPage,
    CreateLoanPage 
    


} from "@/features/loans";


// Módulo brands:


// Módulo groups:


const router = createBrowserRouter([
    // Módulo auth:
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

            // Módulo home:
            {
                index: true,
                element: <HomePage />,
            },

            // Módulo users:
            {
                path: "users",
                element: <ListUserPage />
            },
            {
                path: "users/create",
                element: <CreateUserPage />,
            },
            {
                path: "users/view",
                element: <ViewUserPage />,
            },

            // Módulo consumable-materials:
            {
                path: "consumable-materials",
                element: <ListConsumableMaterialPage />,
            },
            {
                path: "consumable-materials/create",
                element: <CreateConsumablesMaterialPage />,
            },

            // Módulo returnable-materials:
            {
                path: "returnable-materials",
                element: <ListReturnableMaterialPage />
            },
            {
                path: "returnable-materials/create",
                element: <CreateReturnableMaterialPage />,
            },

            // Módulo loans:
            {
                path: "loans",
                element:  <ListLoanPage />,
            },
            {
                path: "loans/create",
                element:  <CreateLoanPage />,
            },

            // Módulo brands:
            {
                path: "brands",
                element: <h1>Marcas</h1>
            },
            {
                path: "brands/create",
                element: <h1>Crear Marcas</h1>,
            },

            // Módulo groups:
            {
                path: "groups",
                element: <h1>Grupos</h1>
            },
            {
                path: "groups/create",
                element: <h1>Crear Grupos</h1>,
            },
        ],
    },


    // Rutas de ver y editar, como rompen el layout de dashboard por el navbar. Se manejaran fuera de la ruta de dashboard.

    // La forma anidada /view/users/123/edit es mejor porque:
    // Es más semántica: primero identificas el recurso (/123) y luego la acción (/edit)
    // Es la convención REST estándar
    // Queda más limpio y legible
    {
        path: "/view",
        element: <ViewLayout />,
        children: [
            // Módulo users:
            {
                path: "users/:id",
                element: <ViewUserPage />,

            },
            {
                path: "users/:id/edit",
                element: <h1>Editar Usuario</h1>,
            },

            // Módulo consumable-materials:
            {
                path: "consumable-materials/:id",
                element: <ViewConsumableMaterialPage />,
            },
            {
                path: "consumable-materials/:id/edit",
                element: <h1>Editar material consumible</h1>,
            },

            // Módulo returnable-materials:
            {
                path: "returnable-materials/:id",
                element: <h1>Ver material devolutivo</h1>,
            },
            {
                path: "returnable-materials/:id/edit",
                element: <h1>Editar material devolutivo</h1>,
            },

            // Módulo loans:
            {
                path: "loans/:id",
                element: <h1>Ver Préstamos</h1>,
            },
            {
                path: "loans/:id/edit",
                element: <h1>Editar Préstamos</h1>,
            },

            // Módulo brands:
            {
                path: "brands/:id",
                element: <h1>Ver Marcas</h1>,
            },
            {
                path: "brands/:id/edit",
                element: <h1>Editar Marcas</h1>,
            },

            // Módulo groups:
            {
                path: "groups/:id",
                element: <h1>Ver Grupos</h1>,
            },
            {
                path: "groups/:id/edit",
                element: <h1>Editar Grupos</h1>,
            },
        ],
    },    
]);

export default router;