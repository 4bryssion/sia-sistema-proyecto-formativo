import { Checkbox } from "@/shared";

const PERMISSION_MODULES = [
  {
    title: "Tipos de documento",
    names: [
      "ver_tipos_documento", "crear_tipo_documento",
      "editar_tipo_documento", "habilitar_deshabilitar_tipo_documento",
    ],
  },
  {
    title: "Marcas",
    names: [
      "ver_marcas", "crear_marca",
      "editar_marca", "habilitar_deshabilitar_marca",
    ],
  },
  {
    title: "Categorías",
    names: [
      "ver_categorias", "crear_categoria",
      "editar_categoria", "habilitar_deshabilitar_categoria",
    ],
  },
  {
    title: "Permisos",
    names: [
      "ver_permisos", "crear_permiso",
      "editar_permiso", "habilitar_deshabilitar_permiso",
    ],
  },
  {
    title: "Grupos",
    names: [
      "ver_grupos", "crear_grupo", "editar_grupo",
      "habilitar_deshabilitar_grupo",
      "asignar_permiso_grupo", "remover_permiso_grupo",
    ],
  },
  {
    title: "Usuarios",
    names: [
      "ver_usuarios", "crear_usuario", "editar_usuario",
      "habilitar_deshabilitar_usuario",
      "asignar_grupo_usuario", "remover_grupo_usuario",
      "asignar_permiso_usuario", "remover_permiso_usuario",
      "generar_reporte_usuarios",
    ],
  },
  {
    title: "Materiales de consumo",
    names: [
      "ver_materiales_consumo", "crear_material_consumo",
      "editar_material_consumo", "habilitar_deshabilitar_material_consumo",
      "generar_reporte_materiales_consumo",
    ],
  },
  {
    title: "Materiales devolutivos",
    names: [
      "ver_materiales_devolutivo", "crear_material_devolutivo",
      "editar_material_devolutivo", "habilitar_deshabilitar_material_devolutivo",
      "generar_reporte_materiales_devolutivo",
    ],
  },
  {
    title: "Préstamos",
    names: [
      "ver_prestamos", "crear_prestamo", "actualizar_prestamo",
      "habilitar_deshabilitar_prestamo", "generar_reporte_prestamos",
    ],
  },
  {
    title: "Retornos de préstamo",
    names: ["ver_retornos_prestamo", "crear_retorno_prestamo"],
  },
  {
    title: "Tareas",
    names: [
      "ver_tareas", "crear_tarea",
      "editar_tarea", "habilitar_deshabilitar_tarea",
    ],
  },
];

export default function AccessRight({
  allPermissions,
  entityPermIds,
  onToggle,
  loading,
  hasSelection,
}) {
  if (!hasSelection) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <p className="text-gray-400 text-sm">
          Selecciona un grupo o usuario para gestionar sus permisos.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <p className="text-gray-500 text-sm">Cargando permisos...</p>
      </div>
    );
  }

  const permByName = Object.fromEntries(
    allPermissions.map((p) => [p.permissionName, p])
  );

  return (
    <div className="relative mt-4">
      <h2 className="font-main text-h2 text-center font-bold mb-6 1400:text-start">
        Permisos
      </h2>

      <div className="grid lg:grid-cols-3 gap-6">
        {PERMISSION_MODULES.map((module) => {
          const modulePerms = module.names
            .map((name) => permByName[name])
            .filter(Boolean);

          if (modulePerms.length === 0) return null;

          return (
            <div key={module.title} className="grid gap-4 justify-items-center">
              <h4 className="text-center font-medium">{module.title}</h4>

              {modulePerms.map((permission) => (
                <Checkbox
                  key={permission.id}
                  id={`perm-${permission.id}`}
                  name={permission.permissionName}
                  label={permission.description}
                  checked={entityPermIds.has(permission.id)}
                  onChange={() => onToggle(permission.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
