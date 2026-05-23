import { Link } from "react-router-dom";

import { 
    Card,
    Button 

} from "@/shared";

import { 
    UsersRound,
    Package,
    RefreshCw,
    HandshakeIcon,
    Share2 

} from "lucide-react";

export default function HomePage(){

    return(
        <div
            className={`mt-10`}
        >
            {/* Hero */}
            <div
                className="
                    w-full grid gap-8 my-11
                "
            >
                <h2
                    className="
                        text-center font-heading text-h2 font-main
                    "
                >
                    Software de Inventario de Infraestructura y Teleinformática
                </h2>

                <h3
                    className="
                        text-center text-h3 font-secondary
                    "
                >
                    Gestión segura, eficiencia garantizada
                </h3>
            </div>

            {/* Cards */}
            <div
                className={`
                    grid gap-6 mx-6 md:grid-cols-2 md:mx-12  1400:grid-cols-4 justify-items-center max-w-max place-self-center
                `}
            >

                <Card
                    icon = {<UsersRound />}

                    title = "Gestión de usuarios:"

                    description = "Crear Ver Listar Modificar Activar/Desactivar"

                    children = {
                        <Link to="/users">
                            <Button children="Seleccionar"/>
                        </Link>
                    }
                />

                <Card
                    icon = {<Package />}

                    title = "Gestión de materiales consumibles:"

                    description = "Crear Ver Listar Modificar Activar/Desactivar"

                    children = {
                        <Link to="/consumable-materials">
                            <Button children="Seleccionar"/>
                        </Link>
                    }
                />

                <Card
                    icon = {<RefreshCw />}

                    title = "Gestión de materiales devolutivos:"

                    description = "Crear Ver Listar Modificar Activar/Desactivar"

                    children = {
                        <Link to="/returnable-materials">
                            <Button children="Seleccionar"/>
                        </Link>
                    }
                />

                <Card
                    icon = {<HandshakeIcon />}

                    title = "Gestión de prestamos:"

                    description = "Crear Ver Listar Modificar Activar/Desactivar"

                    children = {
                        <Link to="/loans">
                            <Button children="Seleccionar"/>
                        </Link>
                    }
                />
            </div>
        </div>
    )
}