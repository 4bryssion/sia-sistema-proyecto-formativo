import { Pencil } from "lucide-react";
import { Checkbox, IconButton, Button } from "@/shared";

export default function AccessRight({
  allPermissions,
  draftPermIds,
  inheritedPermIds,
  isEditing,
  hasSelection,
  entityName,
  loading,
  onToggle,
  onEdit,
  onSave,
  onCancel,
}) {
  // Agrupar permisos dinámicamente por displayName (content_type) — patrón escalable de edward:
  // los módulos y checkboxes se generan recorriendo datos, jamás escribiendo secciones a mano.
  const permsByModule = allPermissions.reduce((acc, perm) => {
    const key = perm.displayName ?? "Sin módulo";
    if (!acc[key]) acc[key] = [];
    acc[key].push(perm);
    return acc;
  }, {});

  return (
    <div className="w-full min-w-0">
      {/* Header: nombre de entidad + lápiz (solo lectura) o Guardar/Cancelar (edición) */}
      <div className="flex items-center justify-between mb-6 min-h-12">
        <h2 className="text-lg font-semibold font-main">
          {entityName ?? "Seleccione un grupo o usuario"}
        </h2>

        {hasSelection && !isEditing && (
          <IconButton ariaLabel="Editar permisos" onClick={onEdit}>
            <Pencil size={20} />
          </IconButton>
        )}

        {isEditing && (
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={onSave}>
              Guardar
            </Button>
            <Button variant="secondary" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500 text-sm">Cargando permisos...</p>
        </div>
      ) : (
        <div className="grid gap-6 min-w-0 overflow-x-auto">
          {Object.entries(permsByModule).map(([displayName, perms]) => (
            <section key={displayName} className="border rounded-lg p-6 min-w-0">
              <h2 className="text-lg font-semibold mb-4 font-main">Módulo {displayName}</h2>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 min-w-0">
                {perms.map((perm) => {
                  const isInherited = inheritedPermIds.has(perm.id);
                  const isChecked   = isInherited || draftPermIds.has(perm.id);
                  // Los heredados permanecen bloqueados incluso en edición: solo se editan permisos directos
                  const isDisabled  = !hasSelection || !isEditing || isInherited;

                  return (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`perm-${perm.id}`}
                        name={perm.permissionCodename}
                        label={perm.permissionName}
                        checked={isChecked}
                        onChange={() => onToggle(perm.id)}
                        disable={isDisabled}
                      />
                      {/* Etiqueta de herencia: reutiliza clases del label de shared/Input */}
                      {isInherited && (
                        <span className="text-caption font-secondary text-text-primary whitespace-nowrap">
                          Grupo
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
