// ---- Catálogo de permisos del sistema y matriz de roles ----
//
// (p51) Vive aparte del seed porque hay DOS programas que necesitan lo mismo:
//   - `prisma/seed.js`, que parte de una base vacía y es autoritativo (borra
//     los permisos de los tres roles base y los vuelve a poner tal cual).
//   - `prisma/sincronizar-permisos.js`, que corre sobre una base ya en uso y
//     solo AÑADE lo que falte, para no borrar los ajustes hechos a mano desde
//     el panel de administración.
//
// Tener la lista en los dos archivos garantizaba que tarde o temprano dijeran
// cosas distintas. Aquí hay una sola copia.

export const contentTypes = [
  { appLabel: 'document-types',       model: 'documentType',       displayName: 'Tipos de documento' },
  { appLabel: 'brands',               model: 'brand',              displayName: 'Marcas' },
  { appLabel: 'inventories',         model: 'inventory',          displayName: 'Inventarios' },
  { appLabel: 'categories',           model: 'category',           displayName: 'Categorías' },
  { appLabel: 'access',               model: 'permission',         displayName: 'Permisos' },
  { appLabel: 'groups',               model: 'group',              displayName: 'Grupos' },
  { appLabel: 'users',                model: 'user',               displayName: 'Usuarios' },
  { appLabel: 'consumable-materials', model: 'consumableMaterial', displayName: 'Materiales de consumo' },
  { appLabel: 'returnable-materials', model: 'returnableMaterial', displayName: 'Materiales devolutivos' },
  { appLabel: 'loans',                model: 'loan',               displayName: 'Préstamos' },
  { appLabel: 'quotations',           model: 'quotation',          displayName: 'Cotizaciones' },
  { appLabel: 'audit',                model: 'auditLog',           displayName: 'Auditoría' },
  { appLabel: 'loan-returns',         model: 'loanReturn',         displayName: 'Retornos de préstamo' },
  { appLabel: 'tasks',                model: 'task',               displayName: 'Tareas' },
  { appLabel: 'notifications',        model: 'notification',       displayName: 'Notificaciones' },
  // (p53) Ajustes del sistema. Hoy solo el correo de soporte; el modulo existe
  // para que el permiso tenga donde colgarse y para el siguiente ajuste.
  { appLabel: 'settings',             model: 'systemSetting',      displayName: 'Ajustes del sistema' },
];

// ---- Catálogo de permisos realineado a los endpoints reales ----
// (P35) description eliminado; se agrega permissionCodename + appLabel para resolución de contentTypeId
// (Fix post-P37) permissionName pasa a ser la etiqueta humana visible (recupera los textos del
// antiguo description); el identificador estable del sistema es permissionCodename (estilo edward).
// `restricted: true` marca los permisos de administración y seguridad del
// sistema: los que deciden quién puede qué. Solo un superadministrador los
// concede o los quita. El resto los reparte cualquiera con permiso para
// repartir, lo tenga él o no, porque son sobre lo que el sistema HACE —
// inventario, préstamos, tareas— y no sobre quién manda.
export const initialPermissions = [
  // Tipos de documento (gestionado por SADMIN)
  { permissionName: 'Ver listado de tipos de documento',            permissionCodename: 'list_document_types',          appLabel: 'document-types' },
  { permissionName: 'Crear nuevo tipo de documento',                permissionCodename: 'create_document_type',         appLabel: 'document-types' },
  { permissionName: 'Editar tipo de documento existente',           permissionCodename: 'edit_document_type',           appLabel: 'document-types' },
  { permissionName: 'Habilitar/Deshabilitar tipo de documento',     permissionCodename: 'toggle_document_type',         appLabel: 'document-types' },

  // Marcas
  { permissionName: 'Ver listado de marcas',                        permissionCodename: 'list_brands',                  appLabel: 'brands' },
  { permissionName: 'Crear nueva marca',                            permissionCodename: 'create_brand',                 appLabel: 'brands' },
  { permissionName: 'Editar marca existente',                       permissionCodename: 'edit_brand',                   appLabel: 'brands' },
  { permissionName: 'Habilitar/Deshabilitar marca',                 permissionCodename: 'toggle_brand',                 appLabel: 'brands' },

  // Inventarios (p48) — mismo juego de permisos que marcas: es el mismo tipo de catálogo
  { permissionName: 'Ver listado de inventarios',                   permissionCodename: 'list_inventories',             appLabel: 'inventories' },
  { permissionName: 'Crear nuevo inventario',                       permissionCodename: 'create_inventory',             appLabel: 'inventories' },
  { permissionName: 'Editar inventario existente',                  permissionCodename: 'edit_inventory',               appLabel: 'inventories' },
  { permissionName: 'Habilitar/Deshabilitar inventario',            permissionCodename: 'toggle_inventory',             appLabel: 'inventories' },

  // Categorías (gestionado por SADMIN)
  { permissionName: 'Ver listado de categorías',                    permissionCodename: 'list_categories',              appLabel: 'categories' },
  { permissionName: 'Crear nueva categoría',                        permissionCodename: 'create_category',              appLabel: 'categories' },
  { permissionName: 'Editar categoría existente',                   permissionCodename: 'edit_category',                appLabel: 'categories' },
  { permissionName: 'Habilitar/Deshabilitar categoría',             permissionCodename: 'toggle_category',              appLabel: 'categories' },

  // Cotizaciones (p50). No hay 'editar': una cotización es un archivo, y lo que
  // se corrige de un archivo equivocado es cargarlo de nuevo y deshabilitar el
  // anterior — no reescribir su contenido.
  { permissionName: 'Ver listado de cotizaciones',                  permissionCodename: 'list_quotations',              appLabel: 'quotations' },
  { permissionName: 'Cargar nuevas cotizaciones',                   permissionCodename: 'create_quotation',             appLabel: 'quotations' },
  { permissionName: 'Habilitar/Deshabilitar cotización',            permissionCodename: 'toggle_quotation',             appLabel: 'quotations' },

  // Auditoría (p50). Permiso EXCLUSIVO del SADMIN: no aparece en la matriz de
  // ningún otro rol, así que solo lo tiene el grupo SuperAdmin, al que el seed
  // le asigna todos los permisos existentes. El registro de auditoría contiene
  // el rastro de todo el mundo, incluidos los administradores, y quien lo
  // descarga puede ver qué hizo cada quien: no es información de gestión diaria.
  { permissionName: 'Descargar la auditoría del sistema',           permissionCodename: 'download_audit',               appLabel: 'audit', restricted: true },

  // Permisos
  { permissionName: 'Ver listado de permisos del sistema',          permissionCodename: 'list_permissions',             appLabel: 'access', restricted: true },
  { permissionName: 'Crear nuevo permiso',                          permissionCodename: 'create_permission',            appLabel: 'access', restricted: true },
  { permissionName: 'Editar permiso existente',                     permissionCodename: 'edit_permission',              appLabel: 'access', restricted: true },
  { permissionName: 'Habilitar/Deshabilitar permiso',               permissionCodename: 'toggle_permission',            appLabel: 'access', restricted: true },

  // Grupos (roles)
  { permissionName: 'Ver listado de grupos',                        permissionCodename: 'list_groups',                  appLabel: 'groups', restricted: true },
  { permissionName: 'Crear nuevo grupo',                            permissionCodename: 'create_group',                 appLabel: 'groups', restricted: true },
  { permissionName: 'Editar grupo existente',                       permissionCodename: 'edit_group',                   appLabel: 'groups', restricted: true },
  { permissionName: 'Habilitar/Deshabilitar grupo',                 permissionCodename: 'toggle_group',                 appLabel: 'groups', restricted: true },
  { permissionName: 'Asignar un permiso a un grupo',                permissionCodename: 'assign_permission_to_group',   appLabel: 'groups', restricted: true },
  { permissionName: 'Remover un permiso de un grupo',               permissionCodename: 'remove_permission_from_group', appLabel: 'groups', restricted: true },

  // Usuarios
  { permissionName: 'Ver listado de usuarios',                      permissionCodename: 'list_users',                   appLabel: 'users' },
  // (p51) `list_users` significa ENTRAR al módulo de usuarios. Leer usuarios
  // para un desplegable —el receptor de un préstamo, el cuentadante de un
  // material, el encargado de una tarea— es otra cosa, y es lo que el
  // Instructor necesita sin tener que ver la tabla. Antes un solo permiso hacía
  // los dos trabajos, y por eso la pantalla de usuarios estaba guardada con
  // `create_user`/`edit_user`, que no es lo que nadie espera.
  { permissionName: 'Leer usuarios en los selectores',              permissionCodename: 'select_users',                 appLabel: 'users' },
  { permissionName: 'Crear nuevo usuario',                          permissionCodename: 'create_user',                  appLabel: 'users' },
  { permissionName: 'Editar usuario existente',                     permissionCodename: 'edit_user',                    appLabel: 'users' },
  { permissionName: 'Habilitar/Deshabilitar usuario',               permissionCodename: 'toggle_user',                  appLabel: 'users' },
  { permissionName: 'Asignar un grupo a un usuario',                permissionCodename: 'assign_group_to_user',         appLabel: 'users', restricted: true },
  { permissionName: 'Remover un grupo de un usuario',               permissionCodename: 'remove_group_from_user',       appLabel: 'users', restricted: true },
  { permissionName: 'Asignar permiso directo a usuario',            permissionCodename: 'assign_permission_to_user',    appLabel: 'users', restricted: true },
  { permissionName: 'Remover permiso directo de usuario',           permissionCodename: 'remove_permission_from_user',  appLabel: 'users', restricted: true },
  { permissionName: 'Generar reporte de usuarios',                  permissionCodename: 'report_users',                 appLabel: 'users' },

  // Materiales de consumo
  { permissionName: 'Ver materiales de consumo',                    permissionCodename: 'list_consumable_materials',    appLabel: 'consumable-materials' },
  { permissionName: 'Crear material de consumo',                    permissionCodename: 'create_consumable_material',   appLabel: 'consumable-materials' },
  { permissionName: 'Editar material de consumo',                   permissionCodename: 'edit_consumable_material',     appLabel: 'consumable-materials' },
  { permissionName: 'Habilitar/Deshabilitar material de consumo',   permissionCodename: 'toggle_consumable_material',   appLabel: 'consumable-materials' },
  { permissionName: 'Generar reporte de materiales de consumo',     permissionCodename: 'report_consumable_materials',  appLabel: 'consumable-materials' },

  // Materiales devolutivos
  { permissionName: 'Ver materiales devolutivos',                   permissionCodename: 'list_returnable_materials',    appLabel: 'returnable-materials' },
  { permissionName: 'Crear material devolutivo',                    permissionCodename: 'create_returnable_material',   appLabel: 'returnable-materials' },
  { permissionName: 'Editar material devolutivo',                   permissionCodename: 'edit_returnable_material',     appLabel: 'returnable-materials' },
  { permissionName: 'Habilitar/Deshabilitar material devolutivo',   permissionCodename: 'toggle_returnable_material',   appLabel: 'returnable-materials' },
  { permissionName: 'Generar reporte de materiales devolutivos',    permissionCodename: 'report_returnable_materials',  appLabel: 'returnable-materials' },

  // Préstamos
  { permissionName: 'Ver listado de préstamos',                     permissionCodename: 'list_loans',                   appLabel: 'loans' },
  { permissionName: 'Registrar nuevo préstamo',                     permissionCodename: 'create_loan',                  appLabel: 'loans' },
  { permissionName: 'Actualizar préstamo activo',                   permissionCodename: 'update_loan',                  appLabel: 'loans' },
  { permissionName: 'Habilitar/Deshabilitar préstamo',              permissionCodename: 'toggle_loan',                  appLabel: 'loans' },
  { permissionName: 'Generar reporte de préstamos',                 permissionCodename: 'report_loans',                 appLabel: 'loans' },
  // (p51) El alcance de lo que se ve, separado de poder entrar al módulo. Mismo
  // patrón que notificaciones: `list_loans` abre la pantalla y muestra los
  // préstamos propios; este amplía la vista a los de todo el mundo. Sin él, el
  // invitado veía los préstamos de cualquiera, contra el RFINV11.
  { permissionName: 'Ver los préstamos de todos los usuarios',      permissionCodename: 'list_all_loans',               appLabel: 'loans' },

  // Retornos de préstamo (inmutables)
  { permissionName: 'Ver retornos de préstamos',                    permissionCodename: 'list_loan_returns',            appLabel: 'loan-returns' },
  { permissionName: 'Registrar retorno de préstamo',                permissionCodename: 'create_loan_return',           appLabel: 'loan-returns' },
  // (P47) Autorizar la devolución que registró otro: es la segunda fase del
  // retorno y la única que mueve stock, por eso es un permiso aparte de registrar
  { permissionName: 'Autorizar devolución de préstamo',             permissionCodename: 'authorize_devolution',          appLabel: 'loan-returns' },
  // (p51) El mismo alcance, para las devoluciones (RFINV14).
  { permissionName: 'Ver las devoluciones de todos los usuarios',   permissionCodename: 'list_all_loan_returns',        appLabel: 'loan-returns' },

  // Tareas
  { permissionName: 'Ver listado de tareas',                        permissionCodename: 'list_tasks',                   appLabel: 'tasks' },
  { permissionName: 'Crear nueva tarea',                            permissionCodename: 'create_task',                  appLabel: 'tasks' },
  { permissionName: 'Editar tarea existente',                       permissionCodename: 'edit_task',                    appLabel: 'tasks' },
  { permissionName: 'Habilitar/Deshabilitar tarea',                 permissionCodename: 'toggle_task',                  appLabel: 'tasks' },
  // (p51) Faltaba: tareas es el quinto modulo con boton "Generar Reporte" y
  // era el unico de los cinco sin un permiso que lo gobernara.
  { permissionName: 'Generar reporte de tareas',                     permissionCodename: 'report_tasks',                 appLabel: 'tasks' },
  // (p50) Lo mínimo para que a alguien se le pueda asignar una tarea: entrar al
  // módulo, abrir LA SUYA y decir si está hecha. No incluye ver las de nadie más
  // ni cambiarle el título, la descripción o la fecha, que es `edit_task`.
  { permissionName: 'Ver y completar las tareas propias',           permissionCodename: 'manage_own_tasks',             appLabel: 'tasks' },

  // notifications — solo lectura.
  //
  // (p50) Son DOS permisos porque hay dos cosas distintas:
  //   - `list_notifications`: abrir la pantalla. Lo tiene TODO el mundo, porque
  //     ahí es donde cada quien ve las tareas que le asignaron.
  //   - `list_system_notifications`: ver el panorama del sistema —los últimos
  //     préstamos y devoluciones— en vez de las tareas propias. Es lo que
  //     distingue a quien administra, y lleva consigo el filtro de criticidad,
  //     que solo tiene sentido cuando hay más de un tipo de aviso en la lista.
  //
  // Se resuelve por permiso y no por nombre de grupo a propósito: así un grupo
  // nuevo puede administrar notificaciones sin tocar una sola línea de código.
  { permissionName: 'Ver listado de notificaciones',                permissionCodename: 'list_notifications',           appLabel: 'notifications' },
  { permissionName: 'Ver notificaciones de todo el sistema',        permissionCodename: 'list_system_notifications',    appLabel: 'notifications' },
  // (p53) El correo de soporte se edita desde «Mi perfil» y lo ve todo el
  // mundo en el login, asi que cambiarlo es administracion del sistema:
  // RESTRINGIDO. El Administrador puede cambiarlo —lo pidio el instructor—
  // pero no puede concederle a nadie la capacidad de cambiarlo.
  { permissionName: 'Editar el correo de soporte',                  permissionCodename: 'edit_support_email',           appLabel: 'settings', restricted: true },
];

// (p51) Roles que el Excel protege: no se renombran (RFADMIN43.1) ni se
// deshabilitan (RFADMIN44.1). La marca vive en la columna `is_system` de la
// tabla; esta lista es solo quién la lleva al sembrar o sincronizar.
export const ROLES_DEL_SISTEMA = ['SuperAdmin', 'Administrador'];

export const roleMatrix = {
  Administrador: [
    // lectura para selects
    'list_document_types',
    // (p51) Categorías con CRUD completo, al nivel de marcas e inventarios: es
    // el mismo tipo de catálogo del inventario y dejarlo en solo lectura obligaba
    // a molestar al superadministrador para crear una categoría nueva, que es
    // trabajo de gestión diaria, no de administración del sistema.
    'list_categories', 'create_category', 'edit_category', 'toggle_category',
    // notificaciones: abre la pantalla y, además, ve el panorama del sistema
    // (últimos préstamos y devoluciones) en vez de sus propias tareas
    'list_notifications', 'list_system_notifications',
    // (p50) También puede tener tareas asignadas y completarlas
    'manage_own_tasks',
    // marcas (CRUD)
    'list_brands', 'create_brand', 'edit_brand', 'toggle_brand',
    // inventarios (CRUD) — mismo alcance que marcas
    'list_inventories', 'create_inventory', 'edit_inventory', 'toggle_inventory',
    // cotizaciones (p50): crear material exige asignarlas, así que quien crea
    // material tiene que poder cargarlas
    'list_quotations', 'create_quotation', 'toggle_quotation',
    // usuarios
    'list_users', 'select_users', 'create_user', 'edit_user', 'toggle_user', 'report_users',
    // panel de accesos (ver + asignaciones; NO crea/edita/togglea grupos ni permisos)
    'list_groups', 'list_permissions',
    // (p51) Crear roles pasa al Administrador por decisión de Santiago,
    // apartándose del RFADMIN41, que lo reservaba al SADMIN: dar de alta un rol
    // como «Almacenistas» es gestión diaria, y no poder hacerlo obligaba a
    // molestar al superadministrador para algo rutinario. Sigue siendo un
    // permiso RESTRINGIDO: el Administrador crea roles, pero no puede concederle
    // a nadie la capacidad de crearlos.
    'create_group',
    // (p51) RFADMIN43 ("Solo SADMIN y administradores pueden actualizar roles") y
    // RFADMIN44 ("Solo Administradores pueden ejecutar esta acción"). Entregarlos exigió
    // implementar antes las cuatro protecciones de group.service.js, porque
    // `isSuperUser` requiere que el grupo SuperAdmin esté activo y sin ellas un
    // Administrador podía dejar fuera al superadministrador.
    'edit_group', 'toggle_group',
    'assign_group_to_user', 'remove_group_from_user',
    'assign_permission_to_user', 'remove_permission_from_user',
    'assign_permission_to_group', 'remove_permission_from_group',
    // (p53) El correo de soporte del login y de «Mi perfil»
    'edit_support_email',
    // materiales de consumo
    'list_consumable_materials', 'create_consumable_material', 'edit_consumable_material',
    'toggle_consumable_material', 'report_consumable_materials',
    // materiales devolutivos
    'list_returnable_materials', 'create_returnable_material', 'edit_returnable_material',
    'toggle_returnable_material', 'report_returnable_materials',
    // préstamos
    'list_loans', 'list_all_loans', 'create_loan', 'update_loan', 'toggle_loan', 'report_loans',
    // retornos
    'list_loan_returns', 'list_all_loan_returns', 'create_loan_return', 'authorize_devolution',
    // tareas
    'list_tasks', 'create_task', 'edit_task', 'toggle_task', 'report_tasks',
  ],

  Instructor: [
    // lectura para selects (usuarios: necesario para prestador/receptor de préstamos,
    // cuentadante de materiales y asignación de tareas — NO incluye crear/editar usuarios)
    // (p51) `select_users` en vez de `list_users`: lo necesitaba para los
    // selectores, no para ver la tabla de usuarios, que el documento no le da.
    'list_brands', 'list_categories', 'select_users', 'list_inventories',
    // (p51) El instructor crea préstamos (RFINST15), y un préstamo a alguien de
    // fuera pide ahora su tipo de documento. Sin este permiso el select llegaba
    // vacío con un 403 y el formulario no se podía terminar.
    'list_document_types',
    // (p50) Notificaciones: sin esto no podía ni abrir la pantalla, y es donde
    // ve las tareas que le asignaron. NO lleva `list_system_notifications`: el
    // panorama de préstamos y devoluciones es de quien administra.
    'list_notifications',
    // cotizaciones (p50): el instructor crea materiales, y crear material exige
    // asignar cotizaciones
    'list_quotations', 'create_quotation', 'toggle_quotation',
    // tareas: el instructor asigna y gestiona tareas, y además puede tener las
    // suyas propias asignadas
    'list_tasks', 'create_task', 'edit_task', 'toggle_task', 'manage_own_tasks', 'report_tasks',
    // materiales de consumo
    'list_consumable_materials', 'create_consumable_material', 'edit_consumable_material',
    'toggle_consumable_material', 'report_consumable_materials',
    // materiales devolutivos
    'list_returnable_materials', 'create_returnable_material', 'edit_returnable_material',
    'toggle_returnable_material', 'report_returnable_materials',
    // préstamos
    'list_loans', 'list_all_loans', 'create_loan', 'update_loan', 'report_loans',
    // retornos
    'list_loan_returns', 'list_all_loan_returns', 'create_loan_return', 'authorize_devolution',
  ],

  Invitado: [
    // (p50) Solo lectura: necesita ver las cotizaciones de un material para
    // poder abrirlas desde su ficha, pero no carga ni deshabilita ninguna.
    'list_quotations',
    // (p50) Igual que el instructor: entra a notificaciones para ver sus tareas
    // asignadas, y nada más.
    'list_notifications',
    // (p50) El aprendiz abre SU tarea en el módulo y la marca como completada.
    // Sin `list_tasks`: no ve las de nadie más.
    'manage_own_tasks',
    'list_returnable_materials', 'report_returnable_materials',
    'list_consumable_materials', 'report_consumable_materials',
    'list_loans',
    'list_loan_returns', 'create_loan_return',
  ],
};
