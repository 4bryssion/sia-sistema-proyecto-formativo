import { Pencil, EllipsisVertical, Undo2, ArrowLeft, ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
    Dropdown,
    DropdownTrigger,
    DropdownItem,
    DropdownContent
} from "@/shared";

export default function LoanRowActions({ loan }) {
    const navigate = useNavigate();

    // Navega a la página de visualizar préstamo
    const handleView = () => {
        navigate(`/view/loans/${loan.id}`);
    };

    // Navega a la página de editar préstamo
    const handleEdit = () => {
        navigate(`/view/loans/${loan.id}/edit`);
    };

    // Navega a la página de retorno del préstamo
    const handleReturn = () => {
        navigate(`/view/loans/${loan.id}/return`);
    };

    return (
        <div className="flex gap-2">

            {/* Botón editar */}
            <button
                onClick={handleEdit}
                className="p-1 rounded hover:bg-gray-900"
            >
                <Pencil size={16} />
            </button>

            {/* Botón retornar préstamo */}
            <button
                onClick={handleReturn}
                className="p-1 rounded hover:bg-gray-900"
            >
                < ArrowLeftRight  size={16} />
            </button>

            {/* Botón opciones */}
            <Dropdown>
                <DropdownTrigger>
                    <button className="p-1 rounded hover:bg-gray-900">
                        <EllipsisVertical size={16} />
                    </button>
                </DropdownTrigger>

                <DropdownContent className="right-0">
                    <DropdownItem>
                        <button onClick={handleView}>
                            Visualizar préstamo
                        </button>
                    </DropdownItem>
                </DropdownContent>
            </Dropdown>
        </div>
    );
}