import { useState } from "react";
import { Pencil, EllipsisVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent } from "@/shared";
import EditBrandPage from "../pages/EditBrandPage";

// Componente de acciones por fila de marca
export default function BrandRowActions({ brand }) {

    const navigate = useNavigate();

    const [isEditOpen, setIsEditOpen] = useState(false);

    // Navega a la página de visualizar marca
    const handleView = () => {
        navigate(`/view/brands/${brand.id}`);
    };

    // Navega a la página de editar marca
    const handleEdit = () => {
        setIsEditOpen(true);
    };

    const handleSave = async (updatedBrand) => {
        if (onBrandUpdated) {
            onBrandUpdated(updatedBrand);
        }
    };

    return (
        <div className="flex gap-2">

            {/* Botón editar */}
            <button onClick={handleEdit} className="p-1 rounded hover:bg-gray-900">
                <Pencil size={16} />
            </button>


            {/* Modal de edición de marca */}
            <EditBrandPage
                brand={brand}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSave={handleSave}
            />

        </div>
    );
}