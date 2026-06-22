import { Pencil, EllipsisVertical } from "lucide-react";
// Hook de React Router para navegar programáticamente entre rutas
import { useNavigate } from "react-router-dom";

import {
    Dropdown,
    DropdownTrigger,
    DropdownItem,
    DropdownContent,
    Checkbox
} from "@/shared";


// Componente que renderiza las acciones de cada fila de usuarios
// Recibe como prop el objeto users
export default function TaskRowActions({ tasks }) {

    // Hook que permite redirigir a otra ruta desde código
    const navigate = useNavigate();


    // Acción para editar los ususarios
    // Redirige a la página de edición usando el id los usuarios
    

    const handleView = () => {
        navigate(`/view/tasks/${tasks.id}`)
    };

    const handleEdit = () => {
        navigate(`/view/tasks/${tasks.id}/edit`)
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
            <Checkbox/>


            {/* Botón option */}
            <Dropdown>

            <DropdownTrigger>
                <button className="p-1 rounded hover:bg-gray-900">
                    <EllipsisVertical size={16} /> {/* Icono de opciones */}
                </button>
            </DropdownTrigger>

            <DropdownContent className="right-0">
                <DropdownItem>
                    <button onClick={handleView}>
                        Visualizar Tarea
                    </button>
                </DropdownItem>
                {/* <DropdownItem>Opción 2</DropdownItem>
                <DropdownItem>Opción 3</DropdownItem> */}
            </DropdownContent>

            </Dropdown>


        </div>
    );
}

