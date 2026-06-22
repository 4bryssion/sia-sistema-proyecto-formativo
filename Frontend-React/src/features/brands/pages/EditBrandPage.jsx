import { Button, Input } from "@/shared";

// Componente visual del modal de edición de marca (sin lógica funcional)
export default function EditBrandPage({ brand, isOpen, onClose }) {

  // Control de render: si el modal no está abierto, no se monta en el DOM
  if (!isOpen) return null;

  return (
    // Overlay del modal: cierra al hacer click afuera
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* Contenedor del modal: detiene el click para no cerrar al hacer click dentro */}
      <div
        className="w-full max-w-md rounded-xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        <h2 className="mb-6 text-xl font-semibold">Editar marca</h2>

        
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <Input
            type="text"
            placeholder="Ingrese el nombre de la marca"

          />
        </div>

        {/* Acciones del modal */}
        <div className="flex justify-end gap-2 mt-6">
          {/* Botón cancelar */}
          <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
            >
                Cancelar
            </Button>

          {/* Botón guardar */}
            <Button
                variant="primary"
                onClick={onClose}
                size="sm"
            >
                Guardar
            </Button>
        </div>
      </div>
    </div>
  );
}