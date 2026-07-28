import { createBrowserRouter, Navigate } from "react-router-dom";
import RequirePermission from "@/shared/components/auth/RequirePermission.jsx";

// Import componentes:

import {    AuthLayout,
    DashboardLayout,
    ViewLayout,
    ProtectedRoute,
    GuestRoute

,
    PermissionsProvider
} from "@/shared"

// Import pages

// Módulo home:
import { 
    HomePage 

} from "@/features/home"

// Módulo auth:
import {
    RecoverPasswordForm,
    AuthLoginForm,
    ResetPasswordForm

} from "@/features/auth";


// Módulo users:
import { 
    ListUserPage, 
    CreateUserPage,
    ViewUserPage,
    EditUserPage 

} from "@/features/users";

// Módulo tasks:
import {
    ListTaskPage,
    ViewTaskPage,
    EditTaskPage
} from "@/features/tasks";


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
    SignLoanPage,

} from "@/features/loans";
//Modulo loan-returns:
import { 
    CreateLoanReturnPage

} from "@/features/loan-returns";


// Módulo brands:
import {
    CreateBrandPage,
    ListBrandPage
} from "@/features/brands";


// Módulo groups:
import{
    ListGroupPage,

} from "@/features/groups";
// Módulo access:
import {
     AccessPage
} from "@/features/access";

// Módulo notifications (P43):
import {
    ListNotificationPage
} from "@/features/notifications";



const router = createBrowserRouter([
    // Módulo auth:
    {
        path: "/",
        element: <Navigate to="auth" replace />
    },

    // Firma de préstamos (P40) — pública, sin sesión: llega desde el enlace del correo.
    // SIN ProtectedRoute NI GuestRoute a propósito: debe funcionar con y sin sesión activa.
    {
        path: "/loans/sign",
        element: <SignLoanPage />,
    },
    {
        path: "/auth",
        element: <GuestRoute><AuthLayout /></GuestRoute>,
        children: [
            {
            index: true,
            element: <AuthLoginForm />,
            }, 

            //Ruta de recuperar contraseña
            {
                path: "recover-password",
                element: <RecoverPasswordForm />,
            },

            //Ruta de nueva contraseña (P39) — recibe resetTicket por router state
            {
                path: "reset-password",
                element: <ResetPasswordForm />,
            },
      
        ],
    },

    {
        path: "/dashboard",
        element: <ProtectedRoute><PermissionsProvider><DashboardLayout /></PermissionsProvider></ProtectedRoute>,
        children: [
            // Notificaciones / logs del sistema (P43)
            {
                path: "alert-history",
                element: <RequirePermission codename="list_notifications"><ListNotificationPage /></RequirePermission>,
            },

            // Módulo home:
            {
                index: true,
                element: <HomePage />,
            },

            // Módulo users:
            {
                path: "users",
                element: <RequirePermission codename={["create_user", "edit_user"]}><ListUserPage /></RequirePermission>
            },
            {
                path: "users/create",
                element: <RequirePermission codename="create_user"><CreateUserPage /></RequirePermission>,
            },
            {
                path: "users/view",
                element: <ViewUserPage />,
            },
            {
                path: "users/edit",
                element: <RequirePermission codename="edit_user"><EditUserPage /></RequirePermission>,
            },
            // Módulo tasks:
            {
                path: "tasks",
                element: <RequirePermission codename="list_tasks"><ListTaskPage /></RequirePermission>,
            },
            // crear tarea ahora es un modal (CreateTaskModal) abierto desde ListTaskPage

            // Módulo consumable-materials:
            {
                path: "consumable-materials",
                element: <RequirePermission codename="list_consumable_materials"><ListConsumableMaterialPage /></RequirePermission>,
            },
            {
                path: "consumable-materials/create",
                element: <RequirePermission codename="create_consumable_material"><CreateConsumablesMaterialPage /></RequirePermission>,
            },
            // Módulo returnable-materials:
            {
                path: "returnable-materials",
                element: <RequirePermission codename="list_returnable_materials"><ListReturnableMaterialPage /></RequirePermission>
            },
            {
                path: "returnable-materials/create",
                element: <RequirePermission codename="create_returnable_material"><CreateReturnableMaterialPage /></RequirePermission>,
            },
            

            // Módulo loans:
            {
                path: "loans",
                element: <RequirePermission codename="list_loans"><ListLoanPage /></RequirePermission>,
            },
            {
                path: "loans/create",
                element: <RequirePermission codename="create_loan"><CreateLoanPage /></RequirePermission>,
            },

            // Módulo brands:
            {
                path: "brands",
                element: <RequirePermission codename="list_brands"><ListBrandPage /></RequirePermission>,
            },
            {
                path: "brands/create",
                element: <RequirePermission codename="create_brand"><CreateBrandPage /></RequirePermission>,
            },

            // Módulo groups:
            {
                path: "groups",
                element: <RequirePermission codename="list_groups"><ListGroupPage /></RequirePermission>
            },

         // Módulo access:
            {
                path: "admin",
                element: <RequirePermission codename="list_permissions"><AccessPage /></RequirePermission>,
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
        element: <ProtectedRoute><PermissionsProvider><ViewLayout /></PermissionsProvider></ProtectedRoute>,
        children: [
            // Módulo users:
            {
                path: "users/:id",
                element: <ViewUserPage />,

            },
            {
                path: "users/:id/edit",
                element: <RequirePermission codename="edit_user"><EditUserPage /></RequirePermission>,
            },
            // Módulo tasks:
            {
                path: "tasks/:id",
                element: <RequirePermission codename="list_tasks"><ViewTaskPage /></RequirePermission>,
            },
            {
                path: "tasks/:id/edit",
                element: <RequirePermission codename="edit_task"><EditTaskPage /></RequirePermission>,
            },

            // Módulo consumable-materials:
            {
                path: "consumable-materials/:id",
                element: <RequirePermission codename="list_consumable_materials"><ViewConsumableMaterialPage /></RequirePermission>,
            },
            {
                path: "consumable-materials/:id/edit",
                element: <RequirePermission codename="edit_consumable_material"><EditConsumibleMaterialPage /></RequirePermission>,
            },

            // Módulo returnable-materials:
            {
                path: "returnable-materials/:id",
                element: <RequirePermission codename="list_returnable_materials"><ViewReturnableMaterialPage /></RequirePermission>,
            },
            {
                path: "returnable-materials/:id/edit",
                element: <RequirePermission codename="edit_returnable_material"><EditReturnableMaterialPage/></RequirePermission>,
            },

            // Módulo loans:
            {
                path: "loans/:id",
                element: <RequirePermission codename="list_loans"><ViewLoanPage/></RequirePermission>,
            },
            {
                path: "loans/:id/edit",
                element: <RequirePermission codename="update_loan"><EditLoanPage/></RequirePermission>,
            },
            // Módulo loan-returns:
{
                path: "loans/:id/return",
                element: <RequirePermission codename="create_loan_return"><CreateLoanReturnPage /></RequirePermission>,
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