import { Pencil, EllipsisVertical } from "lucide-react";

import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent, usePermissions, IconButton } from "@/shared";

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
            <IconButton
                onClick={() => onEdit?.(users.id)}
                ariaLabel="Editar usuario"
                hitSize={36}
                iconSize={16}
            >
                <Pencil size={16} /> {/* Icono de editar */}
            </IconButton>
            )}

            {/* Botón option */}
            <Dropdown>

            <DropdownTrigger>
                <IconButton ariaLabel="Más opciones" hitSize={36} iconSize={16}><EllipsisVertical size={16} /></IconButton>
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
