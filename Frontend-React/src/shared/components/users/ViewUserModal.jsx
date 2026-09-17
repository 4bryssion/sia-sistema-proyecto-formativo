// Visualizar usuario — modal (reemplaza a la antigua página /view/users/:id).
//
// Diferencias respecto a la vista anterior:
// - La información ya NO va dentro de inputs deshabilitados: es label + texto.
//   Un input bloqueado comunica "esto se podría editar pero no puedes", que no
//   es el mensaje de una pantalla de consulta.
// - La foto se amplía al hacer clic (visor superpuesto, se cierra con clic o Escape).
// - Se muestran TODOS los grupos del usuario, no solo el principal.
// - Sin logo del SENA: los modales del proyecto no lo llevan.

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Modal, Button, IconButton, usePermissions, getCurrentUser,
  SupportContactButton, DataPolicyCheckbox,
} from "@/shared";
import { Pencil, X, KeyRound } from "lucide-react";
import userService from "@/shared/services/userService";
import { getTopGroupName } from "@/shared/utils/topGroup";
import CreateTaskModal from "@/shared/components/tasks/CreateTaskModal";
import ChangePasswordModal from "./ChangePasswordModal";
import UserPhoto from "./UserPhoto";
import { API_FILES } from "@/shared/utils/materialFiles";

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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Se recarga cada vez que se abre: los datos pueden haber cambiado desde la
  // última apertura (por ejemplo tras editar).
  // Los setState van DENTRO de la función asíncrona, no en el cuerpo del efecto:
  // llamarlos de forma síncrona ahí encadena un render extra en cada apertura.
  useEffect(() => {
    if (!isOpen || !userId) return;
    (async () => {
      setError(null);
      // Este modal (el del Navbar) vive montado toda la sesión, así que su
      // estado NO se reinicia al cerrarlo. Sin limpiarlo aquí, al abrir otro
      // usuario se arrastraban el visor de foto abierto y los submodales del
      // anterior.
      setZoom(false);
      setIsPasswordModalOpen(false);
      setIsTaskModalOpen(false);
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

  // Objeto estable: CreateTaskModal lo lleva en las dependencias de su efecto,
  // así que uno nuevo en cada render borraría lo que se llevara escrito en el
  // formulario de tarea
  const assignedUser = useMemo(
    () => ({ id: user?.id, name: fullName }),
    [user?.id, fullName],
  );

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
              {/* (p48) La foto es opcional: sin ella se dibuja un icono y el
                  visor de ampliar no tiene nada que ampliar, así que el botón
                  queda deshabilitado en vez de abrir un recuadro vacío */}
              <button
                type="button"
                onClick={() => user.userPhoto && setZoom(true)}
                aria-label="Ampliar foto"
                disabled={!user.userPhoto}
                className="rounded-xl overflow-hidden border border-border cursor-zoom-in hover:opacity-90 transition-opacity disabled:cursor-default"
              >
                <UserPhoto photo={user.userPhoto} alt={fullName} rounded="" />
              </button>

              <h3 className="font-main text-h3 text-center leading-tight">
                @{getTopGroupName(user)} - {fullName}
              </h3>

              {/* El botón de soporte va junto a la insignia y SOLO en el perfil
                  propio: ofrecerle soporte a un administrador "sobre la cuenta de
                  otra persona" no tiene sentido */}
              <div className="flex items-center gap-2">
                <span
                  className={`font-secondary text-small px-3 py-1 rounded-full ${
                    user.isActive
                      ? "bg-(--color-primary-100) text-(--color-primary-950)"
                      : "bg-gray-800 text-text-primary"
                  }`}
                >
                  {user.isActive ? "Activo" : "Inactivo"}
                </span>

                {isOwnProfile && <SupportContactButton />}
              </div>

              {/* Cambiar contraseña: solo el propio dueño de la cuenta. Un
                  administrador NO puede cambiarle la contraseña a otro — el
                  endpoint exige la contraseña ACTUAL, que solo su dueño conoce */}
              {isOwnProfile && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  <KeyRound size={16} />
                  Cambiar contraseña
                </Button>
              )}

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
              {/* (p48) La fecha de inicio es un campo propio del usuario, no la
                  de creación del registro: puede ser anterior (alguien que ya
                  venía vinculado). Y la de finalización ya no admite el caso
                  "sin fecha": desapareció con la excepción de instructor de planta. */}
              <Field label="Fecha de inicio" value={fmtDateOnly(user.userStartDate)} />
              <Field label="Fecha de finalización" value={fmtDateOnly(user.userEndDate)} />

              {/* Consulta del tratamiento de datos que se aceptó al crear la
                  cuenta. Aquí no hay nada que aceptar, solo leer: por eso
                  mode="link" y no la casilla */}
              <div className="sm:col-span-2">
                <DataPolicyCheckbox mode="link" />
              </div>

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
      {/* `loaded` y no `user`: mientras llega el usuario pedido sigue en memoria
          el anterior, y el visor mostraría la foto de otra persona */}
      {zoom && loaded && user.userPhoto && createPortal(
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
            src={`${API_FILES}${user.userPhoto}`}
            alt={fullName}
            className="max-h-[85vh] max-w-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body,
      )}

      {/* Cambiar la propia contraseña (voluntario). El obligatorio del primer
          inicio de sesión lo monta RequirePasswordChange, no este modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Crear tarea con el usuario visualizado preseleccionado y bloqueado */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        assignedUser={assignedUser}
      />
    </>
  );
}
