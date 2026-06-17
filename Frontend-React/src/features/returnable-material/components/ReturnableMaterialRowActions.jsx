import { Pencil, EllipsisVertical } from "lucide-react";
// Hook de React Router para navegar programáticamente entre rutas
import { useNavigate } from "react-router-dom";

import {
    Dropdown,
    DropdownTrigger,
    DropdownItem,
    DropdownContent
} from "@/shared";


// Componente que renderiza las acciones de cada fila de material consumible
// Recibe como prop el objeto returnableMaterial
export default function ReturnableMaterialRowActions({ returnableMaterial }) {

    // Hook que permite redirigir a otra ruta desde código
    const navigate = useNavigate();

    const handleView = () => {
        navigate(`/view/returnable-materials/${returnableMaterial.id}`)
    };

    // Acción para editar el material retornable
    // Error anterior: la ruta no tenía el prefijo /view/ y tenía /edit duplicado
    // Corrección: ruta completa y correcta según el router
    const handleEdit = () => {
        navigate(`/view/returnable-materials/${returnableMaterial.id}/edit`)
    };

    return (
        // Contenedor de los botones de acciones
        <div className="flex gap-2">

            {/* Botón editar */}
            <button
                onClick={handleEdit}
                className="p-1 rounded hover:bg-gray-900"
            >
                <Pencil size={16} />
            </button>

            {/* Botón option */}
            <Dropdown>

            <DropdownTrigger>
                <button className="p-1 rounded hover:bg-gray-900">
                    <EllipsisVertical size={16} />
                </button>
            </DropdownTrigger>

            <DropdownContent className="right-0">
                <DropdownItem>
                    <button onClick={handleView}>
                        Visualizar Material
                    </button>
                </DropdownItem>
            </DropdownContent>

            </Dropdown>

        </div>
    );
}