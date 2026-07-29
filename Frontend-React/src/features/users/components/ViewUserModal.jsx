// Visualizar usuario — modal (reemplaza a la antigua página /view/users/:id).
//
// Diferencias respecto a la vista anterior:
// - La información ya NO va dentro de inputs deshabilitados: es label + texto.
//   Un input bloqueado comunica "esto se podría editar pero no puedes", que no
//   es el mensaje de una pantalla de consulta.
// - La foto se amplía al hacer clic (visor superpuesto, se cierra con clic o Escape).
// - Se muestran TODOS los grupos del usuario, no solo el principal.
// - Sin logo del SENA: los modales del proyecto no lo llevan.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Modal, Button, IconButton, usePermissions, getCurrentUser } from "@/shared";
import { Pencil, X } from "lucide-react";
import userService from "../services/userService";
import { getTopGroupName } from "../utils/topGroup";
import { CreateTaskModal } from "@/features/tasks";

const API_FILES = "http://localhost:5000";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO") : "—");
// timeZone UTC: la columna es DATE, sin hora; sin esto restaría un día en UTC-5
const fmtDateOnly = (d) => (d ? new Date(d).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—");

// Par etiqueta/valor: la unidad de lectura de todo el modal
function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="font-secondary text-small text-text-muted">{label}</p>
      <p className="font-secondary text-body wrap-break-word">{value || "—"}</p>
    </div>
  );
}

export default function ViewUserModal({ isOpen, userId, onClose, onEdit }) {
  const { can } = usePermissions();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Se recarga cada vez que se abre: los datos pueden haber cambiado desde la
  // última apertura (por ejemplo tras editar).
  // Los setState van DENTRO de la función asíncrona, no en el cuerpo del efecto:
  // llamarlos de forma síncrona ahí encadena un render extra en cada apertura.
  useEffect(() => {
    if (!isOpen || !userId) return;
    (async () => {
      setError(null);
      try { setUser(await userService.getById(userId)); }
      catch (err) { setError(err.response?.data?.error ?? "Error al cargar el usuario"); }
    })();
  }, [isOpen, userId]);

  // Mientras llega el usuario pedido puede quedar en memoria el de la apertura
  // anterior; se compara el id para no mostrar datos de otra persona
  const loaded = user && String(user.id) === String(userId);

  // Con la foto ampliada, Escape debe cerrar SOLO el visor. Sin capture:true el
  // listener del Modal se dispararía también y cerraría todo de una vez.
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setZoom(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [zoom]);

  const fullName = `${user?.userFirstName ?? ""} ${user?.userLastName ?? ""}`.trim();

  // Todos los grupos a los que pertenece (el principal es el de más permisos)
  const groupNames = (user?.groups ?? [])
    .map((g) => g.group?.groupName)
    .filter(Boolean);

  // Perfil propio (llegada desde "Mi perfil" del navbar): en vez de asignar una
  // tarea se ofrece ver las propias
  const ownId = getCurrentUser()?.id;
  const isOwnProfile = ownId != null && Number(user?.id) === Number(ownId);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Usuario"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            {can("edit_user") && loaded && (
              <Button variant="primary" size="sm" className="gap-2" onClick={() => onEdit?.(user.id)}>
                <Pencil size={16} />
                Editar
              </Button>
            )}
          </>
        }
      >
        {error ? (
          <p className="text-error font-secondary">{error}</p>
        ) : !loaded ? (
          <p className="text-text-muted font-secondary">Cargando usuario...</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">

            {/* Columna de identidad */}
            <div className="flex flex-col items-center gap-3 lg:border-r lg:border-border lg:pr-6">
              <button
                type="button"
                onClick={() => setZoom(true)}
                aria-label="Ampliar foto"
                className="rounded-xl overflow-hidden border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
              >
                <img
                  src={`${API_FILES}${user.userPhoto ?? ""}`}
                  alt={fullName}
                  className="w-32 h-32 object-contain"
                />
              </button>

              <h3 className="font-main text-h3 text-center leading-tight">
                @{getTopGroupName(user)} - {fullName}
              </h3>

              <span
                className={`font-secondary text-small px-3 py-1 rounded-full ${
                  user.isActive
                    ? "bg-(--color-primary-100) text-(--color-primary-950)"
                    : "bg-gray-800 text-text-primary"
                }`}
              >
                {user.isActive ? "Activo" : "Inactivo"}
              </span>

              {isOwnProfile ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => { onClose?.(); navigate(`/dashboard/tasks?userId=${user.id}`); }}
                >
                  Ver mis tareas
                </Button>
              ) : (
                can("create_task") && (
                  <Button variant="primary" size="sm" onClick={() => setIsTaskModalOpen(true)}>
                    Asignar Tarea
                  </Button>
                )
              )}
            </div>

            {/* Columna de datos */}
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Nombre completo" value={fullName} />
              <Field label="Tipo de documento" value={user.documentType?.documentName} />
              <Field label="Número de documento" value={user.userDocumentNumber} />
              <Field label="Tipo de usuario" value={user.userAccountType} />
              <Field label="Teléfono" value={user.userPhone} />
              <Field label="Teléfono secundario" value={user.userSecondPhone} />
              <Field label="Correo personal" value={user.userEmail} />
              <Field label="Correo institucional" value={user.userEmailInstitutional} />
              <Field label="Dirección" value={user.userAddress} />
              <Field label="Fecha de inicio" value={fmtDate(user.createdAt)} />
              <Field
                label="Fecha de finalización"
                value={user.userEndDate ? fmtDateOnly(user.userEndDate) : "Sin fecha (instructor de planta)"}
              />

              {/* Un usuario puede pertenecer a varios grupos: se listan todos */}
              <div className="sm:col-span-2">
                <p className="font-secondary text-small text-text-muted">Grupos:</p>
                {groupNames.length === 0 ? (
                  <p className="font-secondary text-body">—</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {groupNames.map((name) => (
                      <span
                        key={name}
                        className="font-secondary text-small px-3 py-1 rounded-full bg-(--color-cuaternario-200)"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Visor de la foto ampliada.
          Va en su PROPIO portal a document.body: al renderizarse en el árbol de
          la página quedaba dentro del contexto de apilamiento del contenedor y
          el z-index no lo subía por encima del modal (que sí está en portal).
          Con ambos como hijos directos de body, el z mayor sí manda. */}
      {zoom && user && createPortal(
        <div
          className="fixed inset-0 z-110 flex items-center justify-center bg-black/80 p-6 cursor-zoom-out"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${fullName}`}
        >
          <div className="absolute top-4 right-4">
            <IconButton ariaLabel="Cerrar foto" variant="onColor" onClick={() => setZoom(false)}>
              <X strokeWidth={2.5} />
            </IconButton>
          </div>
          <img
            src={`${API_FILES}${user.userPhoto ?? ""}`}
            alt={fullName}
            className="max-h-[85vh] max-w-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body,
      )}

      {/* Crear tarea con el usuario visualizado preseleccionado y bloqueado */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        assignedUser={{ id: user?.id, name: fullName }}
      />
    </>
  );
}
