import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout } from "@/features/auth/services/logoutService";

import {
    Bell,
    Menu,
    Undo2,
    CircleUser

} from "lucide-react";

import { IconButton, Dropdown, DropdownTrigger, DropdownItem, DropdownContent, getCurrentUser, Alert, usePermissions } from "@/shared";

// Import directo (no vía @/features/users) para no arrastrar el índice completo
// del módulo de usuarios dentro del layout
import ViewUserModal from "@/features/users/components/ViewUserModal";
import EditUserModal from "@/features/users/components/EditUserModal";

import logo from "@/assets/logos/logo-sena-negro.png";


export default function Navbar(){
    const { can } = usePermissions();

    const [view, setView] = useState("main");
    // Id del usuario cuyo perfil se está viendo en el modal (null = cerrado)
    const [profileUserId, setProfileUserId] = useState(null);
    const [editProfileId, setEditProfileId] = useState(null);
    const navigate = useNavigate();

    const handleLogout = async () => {
        // Confirmación de cierre de sesión (el usuario decide sí o sí)
        const result = await Alert.confirm("Cierre de sesión", "¿Está seguro que desea cerrar sesión?");
        if (!result.isConfirmed) return;
        // await: el logout ahora avisa al backend para liberar la sesión única
        // (p45). Sin esperarlo, navegar podría desmontar el componente antes de
        // que saliera la petición y la cuenta quedaría bloqueada.
        await logout();
        navigate("/auth", { replace: true });
    };

    const handleClick = (value) => {
        setView(value)
    }

    // "Mi perfil" abre el modal de visualizar usuario aquí mismo, sin navegar.
    // Antes iba a /view/users/:id, ruta que desapareció al convertir esa vista en
    // modal; montarlo en el Navbar hace que funcione desde cualquier pantalla y
    // para cualquier rol (un Instructor no tiene acceso al listado de usuarios).
    const handleProfileClick = () => {
        const currentUser = getCurrentUser();
        if (currentUser?.id) setProfileUserId(currentUser.id);
    };

    return(
        <nav
            className="w-full sticky top-0 z-50"
            style={{
                background: "linear-gradient(to right, var(--color-cuaternario-950) 49%, var(--color-quintinary-600) 100%)"
            }}
        >
            <div
                className={`
                    mx-auto max-w-screen-2xl px-4 
                `}
            >
                <div
                    className={`
                        flex h-16 items-center justify-between 
                    `}
                >
                    {/* Logo de marca */}
                    <Link 
                        to={"/dashboard"}
                        className={`
                            text-h1
                            font-heading
                            font-main flex gap-6 items-center justify-center
                        `}    
                    >
                        <img src={logo} alt="logo" className="h-12"
                        />

                        <h1
                            className={`
                                font-heading
                                text-h1 hidden sm:flex
                            `}
                        >
                            S.I.I
                        </h1>
                    </Link>

                    {/* Sección derecha: búsqueda + usuario + menu */}
                    <div
                        className={`
                            flex items-center gap-4    
                        `}
                    >
                        {/* Icono de notificaciones de historial general */}
                        {can("list_notifications") && (
                        <Link to="/dashboard/alert-history">
                            <IconButton
                                ariaLabel = "Notificaciones de historial general"
                                variant="onColor"
                            >
                                <Bell strokeWidth={2.8} />
                            </IconButton>
                        </Link>
                        )}

                        {/* Icono de usuario autenticado: abre el modal de su propio perfil */}
                        <IconButton
                            ariaLabel = "Mi perfil de usuario autenticado"
                            variant="onColor"
                            onClick={handleProfileClick}
                        >
                            <CircleUser strokeWidth={2.8} />
                        </IconButton>

                        {/* IconButton + Dropdown */}
                        <div
                            className="z-10"
                        >
                            <Dropdown
                                onOpenChange={(value) => {
                                    if(!value) {
                                        setView("main")
                                    }
                                }}
                            >
                                <DropdownTrigger>
                                    <IconButton
                                        ariaLabel = "Menu"
                                        variant="onColor"
                                    >
                                        <Menu strokeWidth={2.8} />
                                    </IconButton>
                                </DropdownTrigger>

                                <DropdownContent className="right-0 w-48">

                                    {view === "main" ? (

                                        <>
                                            {/* <DropdownItem onClick={handleProfileClick}>
                                                Mi perfil
                                            </DropdownItem> */}

                                            {can("list_permissions") && (
                                            <DropdownItem>
                                                <Link to="/dashboard/admin" className="block w-full">
                                                    Administración de permisos
                                                </Link>
                                            </DropdownItem>
                                            )}

                                            {can(["create_user", "edit_user"]) && (
                                            <DropdownItem>
                                                <Link to="/dashboard/users" className="block w-full">
                                                    Usuarios
                                                </Link>
                                            </DropdownItem>
                                            )}

                                            {can("list_consumable_materials") && (
                                            <DropdownItem>
                                                <Link to="/dashboard/consumable-materials" className="block w-full">
                                                    Materiales consumibles
                                                </Link>
                                            </DropdownItem>
                                            )}

                                            {can("list_returnable_materials") && (
                                            <DropdownItem>
                                                <Link to="/dashboard/returnable-materials" className="block w-full">
                                                    Materiales devolutivos
                                                </Link>
                                            </DropdownItem>
                                            )}

                                            {can("list_loans") && (
                                            <DropdownItem>
                                                <Link to="/dashboard/loans" className="block w-full">
                                                    Prestamos
                                                </Link>
                                            </DropdownItem>
                                            )}

                                            {can("list_tasks") && (
                                            <DropdownItem>
                                                <Link to="/dashboard/tasks" className="block w-full">
                                                    Tareas
                                                </Link>
                                            </DropdownItem>
                                            )}

                                            {(can("list_brands") || can("list_groups")) && (
                                            <DropdownItem
                                                className="block w-full"
                                                keepOpen={true}
                                                onClick={() => handleClick("configuration")}
                                            >
                                                Configuración                                  
                                            </DropdownItem>
                                            )}

                                            <DropdownItem onClick={handleLogout}>
                                                Cerrar sesión
                                            </DropdownItem>
                                        </>

                                    ) : (

                                        <>
                                            <DropdownItem
                                                keepOpen={true}
                                            >
                                                <IconButton
                                                    className={"text-white hover:bg-neutral-400"}
                                                    ariaLabel = "Regresar"
                                                    onClick={() => handleClick("main")}
                                                >
                                                    <Undo2 strokeWidth={2.8} />
                                                </IconButton>
                                            </DropdownItem>

                                            {can("list_brands") && (
                                            <DropdownItem>
                                                <Link to="/dashboard/brands" className="block w-full">
                                                    Marcas
                                                </Link>
                                            </DropdownItem>
                                            )}
                                            
                                            {can("list_groups") && (
                                            <DropdownItem>
                                                <Link to="/dashboard/groups" className="block w-full">
                                                    Grupos
                                                </Link>
                                            </DropdownItem>
                                            )}
                                        </>

                                    )}
                                    
                                </DropdownContent>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mi perfil: modales de visualizar y editar el usuario autenticado.
                Viven en el Navbar para estar disponibles en cualquier pantalla. */}
            <ViewUserModal
                isOpen={profileUserId != null}
                userId={profileUserId}
                onClose={() => setProfileUserId(null)}
                onEdit={(id) => { setProfileUserId(null); setEditProfileId(id); }}
            />

            <EditUserModal
                isOpen={editProfileId != null}
                userId={editProfileId}
                onClose={() => setEditProfileId(null)}
            />
        </nav>
    )
}