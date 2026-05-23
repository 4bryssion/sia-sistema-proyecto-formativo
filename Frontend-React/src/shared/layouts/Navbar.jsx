import { 
    Bell, 
    Menu 

} from "lucide-react";
import { Link } from "react-router-dom";
import { 
    IconButton,
    Dropdown, 
    DropdownTrigger, 
    DropdownItem, 
    DropdownContent

} from "@/shared";

import logo from "@/assets/logos/logo-sena-negro.png";

export default function Navbar(){

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
                        to={"/"}
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
                        <Link to="/alert-history">
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
                            <Dropdown>
                                <DropdownTrigger>
                                    <IconButton
                                        ariaLabel = "Menu"
                                    >
                                        <Menu strokeWidth={2.8} />
                                    </IconButton>
                                </DropdownTrigger>

                                <DropdownContent className="right-0 w-48">

                                    <DropdownItem>
                                        <Link to="/" className="block w-full">
                                            Mi perfil
                                        </Link>
                                    </DropdownItem>

                                    <DropdownItem>
                                        <Link to="/users" className="block w-full">
                                            Usuarios
                                        </Link>
                                    </DropdownItem>

                                    <DropdownItem>
                                        <Link to="/consumable-materials" className="block w-full">
                                            Materiales consumibles
                                        </Link>
                                    </DropdownItem>

                                    <DropdownItem>
                                        <Link to="/returnable-materials" className="block w-full">
                                            Materiales devolutivos
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="/loans" className="block w-full">
                                            Prestamos
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="/" className="block w-full">
                                            Configuración
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="/" className="block w-full">
                                            Cerrar sesión
                                        </Link>
                                    </DropdownItem>
                                    
                                </DropdownContent>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}