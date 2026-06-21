import { createBrowserRouter, Navigate } from "react-router-dom";

// Import componentes:

import {  
    AuthLayout,
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
    ViewUserPage,
    EditUserPage 

} from "@/features/users";


// Módulo consumable-materials:
import { 
    ListConsumableMaterialPage, CreateConsumablesMaterialPage,
    ViewConsumableMaterialPage , EditConsumibleMaterialPage
    
} from "@/features/consumable-material";


// Módulo returnable-materials:
import {
    ListReturnableMaterialPage,
    CreateReturnableMaterialPage,
    ViewReturnableMaterialPage,
    EditReturnableMaterialPage

} from "@/features/returnable-material";

// Módulo loans:
import { 
    ListLoanPage,
    CreateLoanPage,
    ViewLoanPage,
    EditLoanPage,

} from "@/features/loans";


// Módulo brands:
import { 
   
    CreateBrandPage,
    
    ListBrandPage,
    EditBrandPage
     

} from "@/features/brands";


// Módulo groups:

//Módulo permissions:
import { 
   
    ViewPermissionPage
     

} from "@/features/permissions";


const router = createBrowserRouter([
    // Módulo auth:
    {
        path: "/",
        element: <Navigate to="auth" replace />
    },
    {
        path: "/auth",
        element: <AuthLayout />,
        children: [
            {
                index: true
            }
        ],
    },
    {
        path: "/dashboard",
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
            {
                path: "users/edit",
                element: <EditUserPage />,
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
            {
                path: "consumable-materials/edit",
                element: <EditConsumibleMaterialPage />,
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
                element:<ListBrandPage />,
            },
            {
                path: "brands/create",
                element: <h1>Crear marcas</h1>,
            },
            {
                path: "brands/view",
                element: <ListUserPage />,
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

         // Módulo permissions:
            {
                path: "permissions",
                element: < ViewPermissionPage/>,
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
                element: <EditUserPage />,
            },

            // Módulo consumable-materials:
            {
                path: "consumable-materials/:id",
                element: <ViewConsumableMaterialPage />,
            },
            {
                path: "consumable-materials/:id/edit",
                element:<EditConsumibleMaterialPage />,
            },

            // Módulo returnable-materials:
            {
                path: "returnable-materials/:id",
                element: <ViewReturnableMaterialPage />,
            },
            {
                path: "returnable-materials/:id/edit",
                element: <EditReturnableMaterialPage/>,
            },

            // Módulo loans:
            {
                path: "loans/:id",
                element: <ViewLoanPage/>,
            },
            {
                path: "loans/:id/edit",
                element: <EditLoanPage/>,
            },

            // Módulo brands:
            {
                path: "brands/:id",
                element: <h1>Visualizar marca</h1>,
            },
            {
                path: "brands/:id/edit",
                element: <EditBrandPage/>,
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

            // Módulo permissions:
            {
                path: "permissions/:id",
                element:< ViewPermissionPage/>,
            }
        ],
    },    
]);

export default router;