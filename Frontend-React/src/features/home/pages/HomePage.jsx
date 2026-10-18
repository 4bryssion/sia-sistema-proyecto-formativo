import { Link } from "react-router-dom";

import {
    Card,
    Button,
    PermissionGate

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
        codename: "list_users",
        accion: "entrar al módulo de gestión de usuarios",
        icon: <UsersRound />,
        title: "Gestión de usuarios",
        to: "/dashboard/users",
    },
    {
        codename: "list_consumable_materials",
        accion: "entrar al módulo de materiales consumibles",
        icon: <Package />,
        title: "Gestión de materiales consumibles",
        to: "/dashboard/consumable-materials",
    },
    {
        codename: "list_returnable_materials",
        accion: "entrar al módulo de materiales devolutivos",
        icon: <RefreshCw />,
        title: "Gestión de materiales devolutivos",
        to: "/dashboard/returnable-materials",
    },
    {
        codename: "list_loans",
        accion: "entrar al módulo de préstamos",
        icon: <HandshakeIcon />,
        title: "Gestión de préstamos",
        to: "/dashboard/loans",
    },
];

const DESCRIPTION = "Crear Ver Listar Modificar Activar/Desactivar";

export default function HomePage(){
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
                    Software de Inventario y Administración
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
                {CARDS.map((card) => (
                    // (p51) Sin permiso la card NO desaparece: se ve en gris y
                    // al pulsarla dice por qué no se puede. Antes llevaba
                    // `pointer-events-none` y un botón `disabled`: el clic no
                    // llegaba a ninguna parte y la card quedaba muda, que es
                    // justo lo que se lee como aplicación rota.
                    <PermissionGate
                        key={card.title}
                        codename={card.codename}
                        accion={card.accion}
                        className="select-none"
                    >
                        <Card
                            icon={card.icon}
                            title={card.title}
                            description={DESCRIPTION}
                        >
                            <Link to={card.to}>
                                <Button children="Seleccionar" />
                            </Link>
                        </Card>
                    </PermissionGate>
                ))}
            </div>
        </div>
    )
}
