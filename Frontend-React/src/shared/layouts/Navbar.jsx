import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout } from "@/features/auth/services/logoutService";

import {
    Bell,
    Menu,
    Undo2

} from "lucide-react";

import { 
    IconButton,
    Dropdown, 
    DropdownTrigger, 
    DropdownItem, 
    DropdownContent

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

                    {/* Sección derecha: búsqueda + usuario */}
                    <div
                        className={`
                            flex items-center gap-5    
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
                                            <DropdownItem>
                                                <Link to="/dashboard/profile" className="block w-full">
                                                    Mi perfil
                                                </Link>
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