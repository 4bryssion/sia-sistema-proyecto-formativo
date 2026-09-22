import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Input, Alert } from "@/shared";
import userService from "@/shared/services/userService";

/**
 * Modal de solo lectura con los usuarios que pertenecen a un grupo.
 * Información básica (nombre, documento, correo, estado) + filtro de texto.
 * Va atado al mismo permiso que listar grupos (list_groups): quien puede ver el
 * módulo de grupos puede ver su composición.
 *
 * (p50) Pasó a usar el `Modal` compartido. Antes dibujaba su propio velo con
 * `fixed inset-0`, y era el último sitio del proyecto que lo hacía: se quedaba
 * fuera de la pila de teclado, así que no se cerraba con Escape, no bloqueaba el
 * desplazamiento del fondo y no iba en un portal —lo que lo dejaba dentro del
 * contexto de apilamiento de quien lo abriera.
 */
export default function GroupUsersModal({ isOpen, onClose, group }) {
  // El cuerpo solo se monta con el modal abierto: cada apertura arranca limpia
  // sin un useEffect que reinicie el estado, que es lo que hacía antes.
  if (!isOpen) return null;

  return <GroupUsersBody onClose={onClose} group={group} />;
}

function GroupUsersBody({ onClose, group }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!group?.id) return undefined;
    let vigente = true;

    userService
      .getAll("all")
      .then((all) => {
        if (!vigente) return;
        // El usuario trae sus grupos en groups[].group (ver contrato §7 users)
        setUsers(all.filter((u) => u.groups?.some((ug) => ug.group?.id === group.id)));
      })
      .catch((err) => {
        if (vigente) {
          Alert.error("Error al cargar los usuarios del grupo", err.response?.data?.error ?? "");
        }
      })
      .finally(() => { if (vigente) setLoading(false); });

    return () => { vigente = false; };
  }, [group?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.userFirstName, u.userLastName, u.userDocumentNumber, u.userEmail]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, query]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Usuarios del grupo"
      size="lg"
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
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

      {/* La tabla se desplaza dentro de su propia caja, en los dos ejes: en
          pantallas estrechas cuatro columnas no caben, y la página no puede
          desplazarse en horizontal. */}
      <div className="max-h-80 overflow-y-auto overflow-x-auto rounded border border-border">
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
    </Modal>
  );
}
