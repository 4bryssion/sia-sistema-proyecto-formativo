import { Pencil, EllipsisVertical } from "lucide-react";

import { Dropdown, DropdownTrigger, DropdownItem, DropdownContent, usePermissions } from "@/shared";

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
            <button
                onClick={() => onEdit?.(returnableMaterial.id)}
                aria-label="Editar material"
                className="p-1 rounded hover:bg-gray-900 cursor-pointer"
            >
                <Pencil size={16} />
            </button>
            )}

            {/* Botón option */}
            <Dropdown>

            <DropdownTrigger>
                <button className="p-1 rounded hover:bg-gray-900 cursor-pointer" aria-label="Más opciones">
                    <EllipsisVertical size={16} />
                </button>
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
