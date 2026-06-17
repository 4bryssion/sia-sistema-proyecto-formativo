import { Pencil, EllipsisVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent } from "@/shared";

// Componente de acciones por fila de marca
export default function BrandRowActionsView({ brand }) {

    const navigate = useNavigate();

    // Navega a la página de visualizar marca
    const handleView = () => {
        navigate(`/view/brands/${brand.id}`);
    };

    // Navega a la página de editar marca
    const handleEdit = () => {
        navigate(`/view/brands/${brand.id}/edit`);
    };

    return (
        <div className="flex gap-2">

            {/* Botón editar */}
            <button onClick={handleEdit} className="p-1 rounded hover:bg-gray-900">
                <Pencil size={16} />
            </button>

           
        </div>
    );
}