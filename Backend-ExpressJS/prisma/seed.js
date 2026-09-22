import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
// (p50) La misma normalización que usa el backend. El seed la necesita porque
// la columna normalizada es NOT NULL y no tiene valor por defecto: se calcula,
// no se inventa.
import { normalizarNombre } from '../src/shared/normalizeName.js';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ---- Content types (P35): un registro por módulo del sistema ----
const contentTypes = [
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
];

// ---- Catálogo de permisos realineado a los endpoints reales ----
// (P35) description eliminado; se agrega permissionCodename + appLabel para resolución de contentTypeId
// (Fix post-P37) permissionName pasa a ser la etiqueta humana visible (recupera los textos del
// antiguo description); el identificador estable del sistema es permissionCodename (estilo edward).
const initialPermissions = [
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
  { permissionName: 'Descargar la auditoría del sistema',           permissionCodename: 'download_audit',               appLabel: 'audit' },

  // Permisos
  { permissionName: 'Ver listado de permisos del sistema',          permissionCodename: 'list_permissions',             appLabel: 'access' },
  { permissionName: 'Crear nuevo permiso',                          permissionCodename: 'create_permission',            appLabel: 'access' },
  { permissionName: 'Editar permiso existente',                     permissionCodename: 'edit_permission',              appLabel: 'access' },
  { permissionName: 'Habilitar/Deshabilitar permiso',               permissionCodename: 'toggle_permission',            appLabel: 'access' },

  // Grupos (roles)
  { permissionName: 'Ver listado de grupos',                        permissionCodename: 'list_groups',                  appLabel: 'groups' },
  { permissionName: 'Crear nuevo grupo',                            permissionCodename: 'create_group',                 appLabel: 'groups' },
  { permissionName: 'Editar grupo existente',                       permissionCodename: 'edit_group',                   appLabel: 'groups' },
  { permissionName: 'Habilitar/Deshabilitar grupo',                 permissionCodename: 'toggle_group',                 appLabel: 'groups' },
  { permissionName: 'Asignar un permiso a un grupo',                permissionCodename: 'assign_permission_to_group',   appLabel: 'groups' },
  { permissionName: 'Remover un permiso de un grupo',               permissionCodename: 'remove_permission_from_group', appLabel: 'groups' },

  // Usuarios
  { permissionName: 'Ver listado de usuarios',                      permissionCodename: 'list_users',                   appLabel: 'users' },
  { permissionName: 'Crear nuevo usuario',                          permissionCodename: 'create_user',                  appLabel: 'users' },
  { permissionName: 'Editar usuario existente',                     permissionCodename: 'edit_user',                    appLabel: 'users' },
  { permissionName: 'Habilitar/Deshabilitar usuario',               permissionCodename: 'toggle_user',                  appLabel: 'users' },
  { permissionName: 'Asignar un grupo a un usuario',                permissionCodename: 'assign_group_to_user',         appLabel: 'users' },
  { permissionName: 'Remover un grupo de un usuario',               permissionCodename: 'remove_group_from_user',       appLabel: 'users' },
  { permissionName: 'Asignar permiso directo a usuario',            permissionCodename: 'assign_permission_to_user',    appLabel: 'users' },
  { permissionName: 'Remover permiso directo de usuario',           permissionCodename: 'remove_permission_from_user',  appLabel: 'users' },
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

  // Retornos de préstamo (inmutables)
  { permissionName: 'Ver retornos de préstamos',                    permissionCodename: 'list_loan_returns',            appLabel: 'loan-returns' },
  { permissionName: 'Registrar retorno de préstamo',                permissionCodename: 'create_loan_return',           appLabel: 'loan-returns' },
  // (P47) Autorizar la devolución que registró otro: es la segunda fase del
  // retorno y la única que mueve stock, por eso es un permiso aparte de registrar
  { permissionName: 'Autorizar devolución de préstamo',             permissionCodename: 'authorize_devolution',          appLabel: 'loan-returns' },

  // Tareas
  { permissionName: 'Ver listado de tareas',                        permissionCodename: 'list_tasks',                   appLabel: 'tasks' },
  { permissionName: 'Crear nueva tarea',                            permissionCodename: 'create_task',                  appLabel: 'tasks' },
  { permissionName: 'Editar tarea existente',                       permissionCodename: 'edit_task',                    appLabel: 'tasks' },
  { permissionName: 'Habilitar/Deshabilitar tarea',                 permissionCodename: 'toggle_task',                  appLabel: 'tasks' },
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
];

// ---- Catálogos base exigidos por los requerimientos ----
const documentTypes = [
  { documentName: 'Cédula de Ciudadanía',           description: 'Documento de identidad colombiano' },
  { documentName: 'Cédula de Extranjería',          description: 'Documento de identidad para extranjeros residentes' },
  { documentName: 'Tarjeta de Identidad',           description: 'Documento de identidad para menores de edad' },
  { documentName: 'Permiso Especial de Permanencia',description: 'PEP para migrantes' },
  { documentName: 'Permiso por Protección Temporal', description: 'PPT para migrantes' },
];

// (p50) Las tres de origen. `requiresDimensions` viaja en la fila desde ahora:
// la regla dejó de deducirse del nombre, así que el seed tiene que declararla.
const categories = [
  { categoryName: 'Herramienta',         requiresDimensions: false }, // placa SENA e ID opcionales
  { categoryName: 'Maquinaria y equipos', requiresDimensions: false },
  { categoryName: 'Muebles y enseres',   requiresDimensions: true },  // única que solicita dimensiones
];

// ---- Matriz de permisos por rol (P13) ----
// Derivada del xlsx de requerimientos + decisiones acordadas.
// (Fix post-P37) La matriz referencia permissionCodename (identificador estable),
// ya que permissionName ahora es etiqueta visual y puede cambiar.
const roleMatrix = {
  Administrador: [
    // lectura para selects
    'list_document_types', 'list_categories',
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
    'list_users', 'create_user', 'edit_user', 'toggle_user', 'report_users',
    // panel de accesos (ver + asignaciones; NO crea/edita/togglea grupos ni permisos)
    'list_groups', 'list_permissions',
    'assign_group_to_user', 'remove_group_from_user',
    'assign_permission_to_user', 'remove_permission_from_user',
    'assign_permission_to_group', 'remove_permission_from_group',
    // materiales de consumo
    'list_consumable_materials', 'create_consumable_material', 'edit_consumable_material',
    'toggle_consumable_material', 'report_consumable_materials',
    // materiales devolutivos
    'list_returnable_materials', 'create_returnable_material', 'edit_returnable_material',
    'toggle_returnable_material', 'report_returnable_materials',
    // préstamos
    'list_loans', 'create_loan', 'update_loan', 'toggle_loan', 'report_loans',
    // retornos
    'list_loan_returns', 'create_loan_return', 'authorize_devolution',
    // tareas
    'list_tasks', 'create_task', 'edit_task', 'toggle_task',
  ],

  Instructor: [
    // lectura para selects (usuarios: necesario para prestador/receptor de préstamos,
    // cuentadante de materiales y asignación de tareas — NO incluye crear/editar usuarios)
    'list_brands', 'list_categories', 'list_users', 'list_inventories',
    // (p50) Notificaciones: sin esto no podía ni abrir la pantalla, y es donde
    // ve las tareas que le asignaron. NO lleva `list_system_notifications`: el
    // panorama de préstamos y devoluciones es de quien administra.
    'list_notifications',
    // cotizaciones (p50): el instructor crea materiales, y crear material exige
    // asignar cotizaciones
    'list_quotations', 'create_quotation', 'toggle_quotation',
    // tareas: el instructor asigna y gestiona tareas, y además puede tener las
    // suyas propias asignadas
    'list_tasks', 'create_task', 'edit_task', 'toggle_task', 'manage_own_tasks',
    // materiales de consumo
    'list_consumable_materials', 'create_consumable_material', 'edit_consumable_material',
    'toggle_consumable_material', 'report_consumable_materials',
    // materiales devolutivos
    'list_returnable_materials', 'create_returnable_material', 'edit_returnable_material',
    'toggle_returnable_material', 'report_returnable_materials',
    // préstamos
    'list_loans', 'create_loan', 'update_loan', 'report_loans',
    // retornos
    'list_loan_returns', 'create_loan_return', 'authorize_devolution',
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

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD no está definida en .env — no se puede ejecutar el seed.');
  }

  console.log('Iniciando seeds...');

  // 1. Content types (P35): deben existir antes de los permisos para resolver contentTypeId
  for (const ct of contentTypes) {
    await prisma.contentType.upsert({
      where: { appLabel_model: { appLabel: ct.appLabel, model: ct.model } },
      update: { displayName: ct.displayName },
      create: ct,
    });
  }
  console.log(`✓ ${contentTypes.length} content types creados/verificados.`);

  // Mapa appLabel → contentTypeId para asignar a cada permiso
  const allCTs = await prisma.contentType.findMany();
  const ctMap = {};
  for (const ct of allCTs) {
    ctMap[ct.appLabel] = ct.id;
  }

  // 2. Permisos (P35: sin description; con permissionCodename y contentTypeId)
  // (Fix post-P37) upsert por permissionCodename: es la clave estable; permissionName es
  // etiqueta visual actualizable sin duplicar registros.
  for (const permiso of initialPermissions) {
    const contentTypeId = ctMap[permiso.appLabel];
    await prisma.permission.upsert({
      where: { permissionCodename: permiso.permissionCodename },
      update: { permissionName: permiso.permissionName, contentTypeId },
      create: { permissionName: permiso.permissionName, permissionCodename: permiso.permissionCodename, contentTypeId },
    });
  }
  console.log(`✓ ${initialPermissions.length} permisos creados/verificados.`);

  // 2. Tipos de documento (5)
  for (const dt of documentTypes) {
    await prisma.documentType.upsert({
      where: { documentName: dt.documentName },
      update: {},
      create: dt,
    });
  }
  console.log(`✓ ${documentTypes.length} tipos de documento creados/verificados.`);

  // 3. Categorías de material devolutivo (3)
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { categoryName: cat.categoryName },
      update: {},
      create: { ...cat, categoryNameNormalized: normalizarNombre(cat.categoryName) },
    });
  }
  console.log(`✓ ${categories.length} categorías creadas/verificadas.`);

  // 4. Grupo SuperAdmin (SADMIN primigenio)
  const superAdminGroup = await prisma.group.upsert({
    where: { groupName: 'SuperAdmin' },
    update: {},
    create: { groupName: 'SuperAdmin', groupNameNormalized: normalizarNombre('SuperAdmin') },
  });
  console.log('✓ Grupo SuperAdmin creado/verificado.');

  // 5. Asignar TODOS los permisos al grupo SuperAdmin
  const permissions = await prisma.permission.findMany();
  for (const perm of permissions) {
    await prisma.groupPermission.upsert({
      where: { groupId_permissionId: { groupId: superAdminGroup.id, permissionId: perm.id } },
      update: {},
      create: { groupId: superAdminGroup.id, permissionId: perm.id },
    });
  }
  console.log(`✓ ${permissions.length} permisos asignados a SuperAdmin.`);

  // 6. Usuario primigenio SuperAdmin
  const cedula = await prisma.documentType.findUnique({ where: { documentName: 'Cédula de Ciudadanía' } });
  const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  const superAdminUser = await prisma.user.upsert({
    where: { userDocumentNumber: '1000000000' },
    // update no vacío: si ya existía el usuario del seed anterior (admin@sia.local),
    // se actualiza su identidad a SuperAdmin para que el login con superadmin@sia.local funcione.
    update: { userEmail: 'superadmin@sia.local', userFirstName: 'Super', userLastName: 'Admin' },
    create: {
      documentTypeId: cedula.id,
      userFirstName: 'Super',
      userLastName: 'Admin',
      userDocumentNumber: '1000000000',
      // (p48) Ambas fechas son obligatorias. El SuperAdmin es una identidad del
      // sistema, no una persona con vínculo: arranca hoy y no vence.
      userStartDate: new Date(),
      userEndDate: new Date('2030-12-31'),
      userEmail: 'superadmin@sia.local',
      userEmailInstitutional: 'superadmin@sena.edu.co',
      userPhone: '0000000000',
      userAddress: 'Sistema',
      userPhoto: '/uploads/superadmin_default.jpg',
      userPassword: hashedPassword,
      userAccountType: 'Cuentadante',
      // (p48) No se le fuerza el cambio de contraseña: la suya no llega por correo,
      // la define ADMIN_PASSWORD, y forzarlo dejaría el sistema sin acceso al primer arranque.
      mustChangePassword: false,
      // (p48) Identidad del sistema: no hay una persona que acepte el tratamiento de datos
      dataPolicyAcceptedAt: new Date(),
    },
  });
  console.log('✓ Usuario SuperAdmin creado/verificado.');

  // 7. Enlazar usuario al grupo SuperAdmin
  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: superAdminUser.id, groupId: superAdminGroup.id } },
    update: {},
    create: { userId: superAdminUser.id, groupId: superAdminGroup.id },
  });
  console.log('✓ Usuario SuperAdmin enlazado a su grupo.');

  // 8. Roles Administrador / Instructor / Invitado con su matriz de permisos
  for (const [roleName, permCodenames] of Object.entries(roleMatrix)) {
    const group = await prisma.group.upsert({
      where: { groupName: roleName },
      update: {},
      create: { groupName: roleName, groupNameNormalized: normalizarNombre(roleName) },
    });

    // (Fix post-P37) lookup por codename, en línea con la matriz
    const perms = await prisma.permission.findMany({
      where: { permissionCodename: { in: permCodenames } },
    });

    // Seguridad: todos los codenames deben existir en el catálogo (P12)
    if (perms.length !== permCodenames.length) {
      const found = perms.map((p) => p.permissionCodename);
      const missing = permCodenames.filter((n) => !found.includes(n));
      throw new Error(`Permisos inexistentes para ${roleName}: ${missing.join(', ')}`);
    }

    // Resetear permisos del rol para que el seed sea autoritativo (elimina sobrantes de seeds anteriores)
    await prisma.groupPermission.deleteMany({ where: { groupId: group.id } });
    for (const perm of perms) {
      await prisma.groupPermission.create({
        data: { groupId: group.id, permissionId: perm.id },
      });
    }
    console.log(`✓ Rol ${roleName}: ${perms.length} permisos asignados.`);
  }

  console.log('Seed completado.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
