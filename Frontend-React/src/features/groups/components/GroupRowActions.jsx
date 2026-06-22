import { useState } from "react";
import { Pencil, EllipsisVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    Dropdown,
    DropdownTrigger,
    DropdownItem,
    DropdownContent
} from "@/shared";

import EditGroupModal from "../pages/EditGroupModal";

export default function GroupRowActions({ group }) {

    const navigate = useNavigate();

    const [isEditOpen, setIsEditOpen] = useState(false);

    // Navega a la página de visualizar grupo
    const handleView = () => {
        navigate(`/view/groups/${group.id}`);
    };

    // Abre el modal
    const handleEdit = () => {
        setIsEditOpen(true);
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

            {/* Modal */}
            <EditGroupModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
            />

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
                            Visualizar Grupo
                        </button>
                    </DropdownItem>
                </DropdownContent>
            </Dropdown>

        </div>
    );
}