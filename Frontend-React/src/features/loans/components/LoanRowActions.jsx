import { Pencil, EllipsisVertical } from "lucide-react";
// Hook de React Router para navegar programáticamente entre rutas
import { useNavigate } from "react-router-dom";

import {
    Dropdown,
    DropdownTrigger,
    DropdownItem,
    DropdownContent
} from "@/shared";


// Componente que renderiza las acciones de cada fila de préstamo
// Recibe como prop el objeto loan
export default function LoanRowActions({ loan }) {

    // Hook que permite redirigir a otra ruta desde código
    const navigate = useNavigate();

    // Acción para editar el préstamo
    // Redirige a la página de edición usando el id del préstamo
    const handleEdit = () => {
        navigate(`loans/edit/${loan.id}`);
    };

    return (
        // Contenedor de los botones de acciones
        <div className="flex gap-2">

            {/* Botón editar */}
            <button
                onClick={handleEdit} // Ejecuta la navegación a la página de edición
                className="p-1 rounded hover:bg-gray-900"
            >
                <Pencil size={16} /> {/* Icono de editar */}
            </button>

            {/* Botón opciones */}
            <Dropdown>

                <DropdownTrigger>
                    <button className="p-1 rounded hover:bg-gray-900">
                        <EllipsisVertical size={16} /> {/* Icono de opciones */}
                    </button>
                </DropdownTrigger>

                <DropdownContent className="right-0">
                    <DropdownItem>Visualizar</DropdownItem>
                </DropdownContent>

            </Dropdown>

        </div>
    );
}