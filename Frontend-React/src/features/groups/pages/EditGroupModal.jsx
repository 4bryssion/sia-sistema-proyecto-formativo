import { Button, Input } from "@/shared";

// Componente visual del modal de edición de grupo
export default function EditGroupModal({ isOpen, onClose }) {

  // Si el modal está cerrado no se renderiza
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >

        <h2 className="mb-6 text-xl font-semibold">
          Editar Grupo
        </h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre del grupo
          </label>

          <Input
            type="text"
            placeholder="Ingrese el nombre del grupo"
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">

          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Guardar
          </Button>

        </div>

      </div>
    </div>
  );
}