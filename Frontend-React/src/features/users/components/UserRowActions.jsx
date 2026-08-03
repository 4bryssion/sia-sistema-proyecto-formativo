import { Pencil, EllipsisVertical } from "lucide-react";

import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent, usePermissions } from "@/shared";

// Acciones de cada fila de usuarios.
//
// Ver y editar ya no navegan a una página: abren los modales que ListUserPage
// mantiene en una sola instancia. Por eso este componente recibe onView/onEdit
// y ya no usa useNavigate.
export default function UserRowActions({ users, onView, onEdit }) {
  const { can } = usePermissions();

    return (
        // Contenedor de los botones de acciones
        <div className="flex gap-2">

            {/* Botón editar */}
            {can("edit_user") && (
            <button
                onClick={() => onEdit?.(users.id)}
                aria-label="Editar usuario"
                className="p-1 rounded hover:bg-gray-900 cursor-pointer"
            >
                <Pencil size={16} /> {/* Icono de editar */}
            </button>
            )}

            {/* Botón option */}
            <Dropdown>

            <DropdownTrigger>
                <button className="p-1 rounded hover:bg-gray-900 cursor-pointer" aria-label="Más opciones">
                    <EllipsisVertical size={16} /> {/* Icono de opciones */}
                </button>
            </DropdownTrigger>

            <DropdownContent className="right-0">
                <DropdownItem onClick={() => onView?.(users.id)}>
                    Visualizar Usuario
                </DropdownItem>
            </DropdownContent>

            </Dropdown>

        </div>
    );
}
