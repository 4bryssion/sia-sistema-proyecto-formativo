// frontend/src/features/access/components/AddIndividualPermissionForm.jsx

export default function AddIndividualPermissionForm() {
  return (
    <div>
      <h3 className="text-white font-semibold mb-4">Agregar Permiso Individual</h3>

      <label className="block text-white text-xs mb-1">ID/Nombre del Usuario</label>
      <input
        type="text"
        placeholder="Ej: 1032004/Martinez"
        className="w-full rounded px-3 py-2 text-sm mb-4 focus:outline-none"
      />

      <button
        type="button"
        className="w-full rounded bg-green-600 text-white py-2 text-sm hover:bg-green-700"
      >
        Confirmar
      </button>
    </div>
  );
}