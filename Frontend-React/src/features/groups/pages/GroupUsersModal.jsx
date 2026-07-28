import { useState, useEffect, useMemo } from "react";
import { Button, Input, Alert } from "@/shared";
import userService from "@/features/users/services/userService";

/**
 * Modal de solo lectura con los usuarios que pertenecen a un grupo.
 * Información básica (nombre, documento, correo, estado) + filtro de texto.
 * Va atado al mismo permiso que listar grupos (list_groups): quien puede ver el
 * módulo de grupos puede ver su composición.
 */
export default function GroupUsersModal({ isOpen, onClose, group }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen || !group?.id) return;
    setQuery("");
    setLoading(true);
    userService
      .getAll("all")
      .then((all) =>
        // El usuario trae sus grupos en groups[].group (ver contrato §7 users)
        setUsers(all.filter((u) => u.groups?.some((ug) => ug.group?.id === group.id)))
      )
      .catch((err) =>
        Alert.error("Error al cargar los usuarios del grupo", err.response?.data?.error ?? "")
      )
      .finally(() => setLoading(false));
  }, [isOpen, group?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.userFirstName, u.userLastName, u.userDocumentNumber, u.userEmail]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* text-neutral-900 explícito para no heredar colores claros del contexto */}
      <div
        className="w-full max-w-2xl rounded-xl bg-white p-6 text-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-xl font-semibold">Usuarios del grupo</h2>
        <p className="mb-4 text-caption text-text-secondary font-secondary">
          {group?.groupName} — {filtered.length} usuario(s)
        </p>

        <Input
          label="Buscar"
          placeholder="Nombre, documento o correo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-4 md:max-w-full"
        />

        <div className="max-h-80 overflow-y-auto rounded border border-border">
          <table className="w-full font-secondary">
            <thead className="bg-(--color-cuaternario-950)">
              <tr>
                <th className="p-3 py-2 text-left border-b">Nombre</th>
                <th className="p-3 py-2 text-left border-b">Documento</th>
                <th className="p-3 py-2 text-left border-b">Correo</th>
                <th className="p-3 py-2 text-left border-b">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="px-3 py-2" colSpan={4}>Cargando...</td></tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr><td className="px-3 py-2" colSpan={4}>Este grupo no tiene usuarios.</td></tr>
              )}

              {!loading && filtered.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-100">
                  <td className="px-3 py-2 border-b">{u.userFirstName} {u.userLastName}</td>
                  <td className="px-3 py-2 border-b">{u.userDocumentNumber}</td>
                  <td className="px-3 py-2 border-b">{u.userEmail}</td>
                  <td className="px-3 py-2 border-b">{u.isActive ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="primary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
