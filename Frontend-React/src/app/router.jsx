import { createBrowserRouter, Navigate } from "react-router-dom";
import RequirePermission from "@/shared/components/auth/RequirePermission.jsx";

// Import componentes:

import {    AuthLayout,
    DashboardLayout,
    ViewLayout,
    ProtectedRoute,
    GuestRoute

,
    PermissionsProvider,
    RequirePasswordChange
} from "@/shared"

// Import pages

// Módulo home:
import { 
    HomePage 

} from "@/features/home"

// Módulo auth:
import {
    RecoverPasswordForm,
    VerifyCodeForm,
    AuthLoginForm,
    ResetPasswordForm

} from "@/features/auth";


// Módulo users:
// Visualizar, editar y CREAR usuario ya no tienen ruta: son modales
// (visualizar/editar jul-2026; crear, p49)
import { ListUserPage } from "@/features/users";

// Módulo tasks:
// Visualizar y editar tarea ya no tienen ruta: son modales (p50)
import { ListTaskPage } from "@/features/tasks";


// Módulo consumable-materials:
// Visualizar y editar material de consumo ya no tienen ruta: son modales (jul-2026)
import {
    ListConsumableMaterialPage

} from "@/features/consumable-material";


// Módulo returnable-materials:
// Visualizar y editar ya no tienen ruta: son modales que abre el listado
import {
    ListReturnableMaterialPage,

} from "@/features/returnable-material";

// Módulo loans:
import {
    ListLoanPage,
    SignLoanPage,

} from "@/features/loans";


// Módulo brands:
import {
    ListBrandPage
} from "@/features/brands";


// Módulo inventories (p48): gemelo de brands. Se llega desde el dropdown de
// Configuración del navbar, debajo de Marcas.
import {
    ListInventoryPage
} from "@/features/inventories";

// Módulo categories (p50): mismo patrón que marcas e inventarios. Se llega desde
// el dropdown de Configuración de la navbar, entre Marcas e Inventarios.
import { ListCategoryPage } from "@/features/categories";

// Módulo quotations (p50): PDF que respaldan el precio de los materiales.
// Se llega desde el menú de la navbar, encima de Tareas.
import { ListQuotationPage } from "@/features/quotations";


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

            // Flujo de recuperación separado en 3 vistas (jul-2026):
            // 1) pedir el código con el correo
            {
                path: "recover-password",
                element: <RecoverPasswordForm />,
            },

            // 2) ingresar el código — recibe el correo por router state
            {
                path: "verify-code",
                element: <VerifyCodeForm />,
            },

            // 3) nueva contraseña (P39) — recibe resetTicket por router state
            {
                path: "reset-password",
                element: <ResetPasswordForm />,
            },
      
        ],
    },

    {
        path: "/dashboard",
        // (p48) RequirePasswordChange va dentro de ProtectedRoute —sin sesión no
        // hay nada que bloquear— y dentro de PermissionsProvider, porque al
        // desbloquear tiene que pedirle que rehaga los permisos: con la
        // contraseña temporal sin cambiar, su petición se comió un 403 y la
        // lista quedó vacía
        element: <ProtectedRoute><PermissionsProvider><RequirePasswordChange><DashboardLayout /></RequirePasswordChange></PermissionsProvider></ProtectedRoute>,
        children: [
            // Notificaciones / logs del sistema (P43)
            {
                path: "notifications",
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
            // Módulo tasks:
            // (p50) Dos permisos entran: `list_tasks` ve las de todo el mundo y
            // `manage_own_tasks` solo las propias. Quien solo tiene el segundo
            // entra a ver su tarea y marcarla como completada; el backend
            // vuelve a decidir qué le entrega.
            {
                path: "tasks",
                element: <RequirePermission codename={["list_tasks", "manage_own_tasks"]}><ListTaskPage /></RequirePermission>,
            },
            // crear tarea ahora es un modal (CreateTaskModal) abierto desde ListTaskPage

            // Módulo consumable-materials:
            {
                path: "consumable-materials",
                element: <RequirePermission codename="list_consumable_materials"><ListConsumableMaterialPage /></RequirePermission>,
            },
            // Módulo returnable-materials:
            {
                path: "returnable-materials",
                element: <RequirePermission codename="list_returnable_materials"><ListReturnableMaterialPage /></RequirePermission>
            },
            

            // Módulo loans:
            {
                path: "loans",
                element: <RequirePermission codename="list_loans"><ListLoanPage /></RequirePermission>,
            },

            // Módulo brands:
            {
                path: "brands",
                element: <RequirePermission codename="list_brands"><ListBrandPage /></RequirePermission>,
            },

            // Módulo quotations:
            {
                path: "quotations",
                element: <RequirePermission codename="list_quotations"><ListQuotationPage /></RequirePermission>,
            },

            // Módulo categories:
            {
                path: "categories",
                element: <RequirePermission codename="list_categories"><ListCategoryPage /></RequirePermission>,
            },

            // Módulo inventories:
            {
                path: "inventories",
                element: <RequirePermission codename="list_inventories"><ListInventoryPage /></RequirePermission>,
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
        element: <ProtectedRoute><PermissionsProvider><RequirePasswordChange><ViewLayout /></RequirePasswordChange></PermissionsProvider></ProtectedRoute>,
        children: [
            // Módulo users: sin rutas de ver ni editar — ahora son modales
            // (ViewUserModal / EditUserModal), abiertos desde la tabla y, en el
            // caso de "Mi perfil", desde el propio Navbar.

            // Módulo tasks: sin rutas de ver ni editar — son modales abiertos
            // desde la tabla de listar (p50)

            // Módulo consumable-materials:
            // Módulo consumable-materials: sin rutas de ver ni editar — son
            // modales abiertos desde la tabla de listar

            // Módulo returnable-materials: sin rutas de ver ni editar — son
            // modales abiertos desde la tabla de listar

            // Módulo loans:
            // Módulo loans: visualizar, editar y retornar son modales que abre la
            // tabla de listar; ya no tienen ruta propia
            // Módulo loan-returns: retornar es un modal abierto desde la tabla
            // de listar préstamos, ya no tiene ruta propia

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