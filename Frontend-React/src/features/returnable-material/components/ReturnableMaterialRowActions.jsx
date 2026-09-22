import { Pencil, EllipsisVertical } from "lucide-react";

import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent, usePermissions, IconButton } from "@/shared";

// Acciones de cada fila de materiales devolutivos.
//
// Ver y editar ya no navegan a una página: abren los modales que
// ListReturnableMaterialPage mantiene en una sola instancia. Por eso este
// componente recibe onView/onEdit y ya no usa useNavigate.
export default function ReturnableMaterialRowActions({ returnableMaterial, onView, onEdit }) {
  const { can } = usePermissions();

    return (
        // Contenedor de los botones de acciones
        <div className="flex gap-2">

            {/* Botón editar — oculto para roles de solo lectura (INV y nuevos) */}
            {can("edit_returnable_material") && (
            <IconButton
                onClick={() => onEdit?.(returnableMaterial.id)}
                ariaLabel="Editar material"
                hitSize={36}
                iconSize={16}
            >
                <Pencil size={16} />
            </IconButton>
            )}

            {/* Botón option */}
            <Dropdown>

            <DropdownTrigger>
                <IconButton ariaLabel="Más opciones" hitSize={36} iconSize={16}><EllipsisVertical size={16} /></IconButton>
            </DropdownTrigger>

            <DropdownContent className="right-0">
                <DropdownItem onClick={() => onView?.(returnableMaterial.id)}>
                    Visualizar Material
                </DropdownItem>
            </DropdownContent>

            </Dropdown>

        </div>
    );
}
