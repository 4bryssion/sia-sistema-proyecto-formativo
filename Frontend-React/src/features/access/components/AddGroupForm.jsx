// frontend/src/features/access/components/AddGroupForm.jsx

export default function AddGroupForm() {
  return (
    <div>
      <h3 className="text-white font-semibold mb-4">Agregar Grupo</h3>

      <label className="block text-white text-xs mb-1">Nombre del grupo</label>
      <input
        type="text"
        placeholder="Ej: Administrador"
        className="w-full rounded px-3 py-2 text-sm mb-4 focus:outline-none"
      />

      <button
        type="button"
        className="w-full rounded bg-green-600 text-white py-2 text-sm hover:bg-green-700"
      >
        Agregar grupo
      </button>
    </div>
  );
}