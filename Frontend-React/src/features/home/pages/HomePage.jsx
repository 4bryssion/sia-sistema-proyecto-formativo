import { Link } from "react-router-dom";

import {
    Card,
    Button,
    usePermissions

} from "@/shared";

import {
    UsersRound,
    Package,
    RefreshCw,
    HandshakeIcon,
    Share2

} from "lucide-react";

// Cards del home declaradas como datos: el grid siempre renderiza las mismas 4,
// así el layout y la responsividad no cambian según los permisos del usuario.
const CARDS = [
    {
        codename: ["create_user", "edit_user"],
        icon: <UsersRound />,
        title: "Gestión de usuarios:",
        to: "/dashboard/users",
    },
    {
        codename: "list_consumable_materials",
        icon: <Package />,
        title: "Gestión de materiales consumibles:",
        to: "/dashboard/consumable-materials",
    },
    {
        codename: "list_returnable_materials",
        icon: <RefreshCw />,
        title: "Gestión de materiales devolutivos:",
        to: "/dashboard/returnable-materials",
    },
    {
        codename: "list_loans",
        icon: <HandshakeIcon />,
        title: "Gestión de prestamos:",
        to: "/dashboard/loans",
    },
];

const DESCRIPTION = "Crear Ver Listar Modificar Activar/Desactivar";

export default function HomePage(){
    const { can } = usePermissions();

    return(
        <div
            className={`mt-10 pb-4`}
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
                    Software de Inventario de Infraestructura
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
                {CARDS.map((card) => {
                    const allowed = can(card.codename);

                    return (
                        // Sin permiso la card NO desaparece: se muestra en gris y bloqueada
                        <div
                            key={card.codename}
                            className={allowed ? "" : "opacity-50 pointer-events-none select-none"}
                            title={allowed ? undefined : "No tienes permisos para este módulo"}
                        >
                            <Card
                                icon = {card.icon}

                                title = {card.title}

                                description = {DESCRIPTION}

                                children = {
                                    allowed ? (
                                        <Link to={card.to}>
                                            <Button children="Seleccionar" />
                                        </Link>
                                    ) : (
                                        <Button children="Seleccionar" disabled />
                                    )
                                }
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
