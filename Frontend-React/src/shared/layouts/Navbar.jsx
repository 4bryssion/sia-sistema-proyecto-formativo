import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout } from "@/features/auth/services/logoutService";

import {
    Bell,
    Menu,
    Undo2,
    CircleUser

} from "lucide-react";

import {
    IconButton,
    Dropdown,
    DropdownTrigger,
    DropdownItem,
    DropdownContent,
    getCurrentUser

} from "@/shared";

import logo from "@/assets/logos/logo-sena-negro.png";

export default function Navbar(){

    const [view, setView] = useState("main");
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/auth", { replace: true });
    };

    const handleClick = (value) => {
        setView(value)
    }

    // Reusa el módulo de usuarios (P20+P21): navega al "ver" del usuario autenticado
    // tomando el id guardado en sessionStorage al hacer login (ver authService/AuthLoginForm).
    const handleProfileClick = () => {
        const currentUser = getCurrentUser();
        if (currentUser?.id) {
            navigate(`/view/users/${currentUser.id}`);
        }
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
                            S.I.T.
                        </h1>
                    </Link>

                    {/* Sección derecha: búsqueda + usuario + menu */}
                    <div
                        className={`
                            flex items-center gap-4    
                        `}
                    >
                        {/* Icono de notificaciones de historial general */}
                        <Link to="/dashboard/alert-history">
                            <IconButton
                                ariaLabel = "Notificaciones de historial general"
                            >
                                <Bell strokeWidth={2.8} />
                            </IconButton>
                        </Link>

                        {/* Icono de usuario autenticado: ver el propio perfil (reusa ViewUserPage) */}
                        <IconButton
                            ariaLabel = "Mi perfil de usuario autenticado"
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
                                    >
                                        <Menu strokeWidth={2.8} />
                                    </IconButton>
                                </DropdownTrigger>

                                <DropdownContent className="right-0 w-48">

                                    {view === "main" ? (

                                        <>
                                            <DropdownItem onClick={handleProfileClick}>
                                                Mi perfil
                                            </DropdownItem>

                                            <DropdownItem>
                                                <Link to="/dashboard/admin" className="block w-full">
                                                    Admin
                                                </Link>
                                            </DropdownItem>

                                            <DropdownItem>
                                                <Link to="/dashboard/users" className="block w-full">
                                                    Usuarios
                                                </Link>
                                            </DropdownItem>

                                            <DropdownItem>
                                                <Link to="/dashboard/consumable-materials" className="block w-full">
                                                    Materiales consumibles
                                                </Link>
                                            </DropdownItem>

                                            <DropdownItem>
                                                <Link to="/dashboard/returnable-materials" className="block w-full">
                                                    Materiales devolutivos
                                                </Link>
                                            </DropdownItem>

                                            <DropdownItem>
                                                <Link to="/dashboard/loans" className="block w-full">
                                                    Prestamos
                                                </Link>
                                            </DropdownItem>

                                            <DropdownItem>
                                                <Link to="/dashboard/tasks" className="block w-full">
                                                    Tareas
                                                </Link>
                                            </DropdownItem>

                                            <DropdownItem
                                                className="block w-full"
                                                keepOpen={true}
                                                onClick={() => handleClick("configuration")}
                                            >
                                                Configuración                                  
                                            </DropdownItem>

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

                                            <DropdownItem>
                                                <Link to="/dashboard/brands" className="block w-full">
                                                    Marcas
                                                </Link>
                                            </DropdownItem>
                                            
                                            <DropdownItem>
                                                <Link to="/dashboard/groups" className="block w-full">
                                                    Grupos
                                                </Link>
                                            </DropdownItem>
                                        </>

                                    )}
                                    
                                </DropdownContent>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}