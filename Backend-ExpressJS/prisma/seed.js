import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ---- Content types (P35): un registro por módulo del sistema ----
const contentTypes = [
  { appLabel: 'document-types',       model: 'documentType',       displayName: 'Tipos de documento' },
  { appLabel: 'brands',               model: 'brand',              displayName: 'Marcas' },
  { appLabel: 'categories',           model: 'category',           displayName: 'Categorías' },
  { appLabel: 'access',               model: 'permission',         displayName: 'Permisos' },
  { appLabel: 'groups',               model: 'group',              displayName: 'Grupos' },
  { appLabel: 'users',                model: 'user',               displayName: 'Usuarios' },
  { appLabel: 'consumable-materials', model: 'consumableMaterial', displayName: 'Materiales de consumo' },
  { appLabel: 'returnable-materials', model: 'returnableMaterial', displayName: 'Materiales devolutivos' },
  { appLabel: 'loans',                model: 'loan',               displayName: 'Préstamos' },
  { appLabel: 'loan-returns',         model: 'loanReturn',         displayName: 'Retornos de préstamo' },
  { appLabel: 'tasks',                model: 'task',               displayName: 'Tareas' },
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

  // Categorías (gestionado por SADMIN)
  { permissionName: 'Ver listado de categorías',                    permissionCodename: 'list_categories',              appLabel: 'categories' },
  { permissionName: 'Crear nueva categoría',                        permissionCodename: 'create_category',              appLabel: 'categories' },
  { permissionName: 'Editar categoría existente',                   permissionCodename: 'edit_category',                appLabel: 'categories' },
  { permissionName: 'Habilitar/Deshabilitar categoría',             permissionCodename: 'toggle_category',              appLabel: 'categories' },

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

  // Tareas
  { permissionName: 'Ver listado de tareas',                        permissionCodename: 'list_tasks',                   appLabel: 'tasks' },
  { permissionName: 'Crear nueva tarea',                            permissionCodename: 'create_task',                  appLabel: 'tasks' },
  { permissionName: 'Editar tarea existente',                       permissionCodename: 'edit_task',                    appLabel: 'tasks' },
  { permissionName: 'Habilitar/Deshabilitar tarea',                 permissionCodename: 'toggle_task',                  appLabel: 'tasks' },
];

// ---- Catálogos base exigidos por los requerimientos ----
const documentTypes = [
  { documentName: 'Cédula de Ciudadanía',           description: 'Documento de identidad colombiano' },
  { documentName: 'Cédula de Extranjería',          description: 'Documento de identidad para extranjeros residentes' },
  { documentName: 'Tarjeta de Identidad',           description: 'Documento de identidad para menores de edad' },
  { documentName: 'Permiso Especial de Permanencia',description: 'PEP para migrantes' },
  { documentName: 'Permiso por Protección Temporal', description: 'PPT para migrantes' },
];

const categories = [
  { categoryName: 'Herramienta' },          // placa SENA e ID opcionales
  { categoryName: 'Maquinaria y equipos' },
  { categoryName: 'Muebles y enseres' },    // única categoría que solicita dimensiones
];

// ---- Matriz de permisos por rol (P13) ----
// Derivada del xlsx de requerimientos + decisiones acordadas.
// (Fix post-P37) La matriz referencia permissionCodename (identificador estable),
// ya que permissionName ahora es etiqueta visual y puede cambiar.
const roleMatrix = {
  Administrador: [
    // lectura para selects
    'list_document_types', 'list_categories',
    // marcas (CRUD)
    'list_brands', 'create_brand', 'edit_brand', 'toggle_brand',
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
    'list_loan_returns', 'create_loan_return',
    // tareas
    'list_tasks', 'create_task', 'edit_task', 'toggle_task',
  ],

  Instructor: [
    // lectura para selects
    'list_brands', 'list_categories',
    // materiales de consumo
    'list_consumable_materials', 'create_consumable_material', 'edit_consumable_material',
    'toggle_consumable_material', 'report_consumable_materials',
    // materiales devolutivos
    'list_returnable_materials', 'create_returnable_material', 'edit_returnable_material',
    'toggle_returnable_material', 'report_returnable_materials',
    // préstamos
    'list_loans', 'create_loan', 'update_loan', 'report_loans',
    // retornos
    'list_loan_returns', 'create_loan_return',
  ],

  Invitado: [
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
      create: cat,
    });
  }
  console.log(`✓ ${categories.length} categorías creadas/verificadas.`);

  // 4. Grupo SuperAdmin (SADMIN primigenio)
  const superAdminGroup = await prisma.group.upsert({
    where: { groupName: 'SuperAdmin' },
    update: {},
    create: { groupName: 'SuperAdmin' },
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
      userEndDate: new Date('2030-12-31'),
      userEmail: 'superadmin@sia.local',
      userEmailInstitutional: 'superadmin@sena.edu.co',
      userPhone: '0000000000',
      userAddress: 'Sistema',
      userPhoto: '/uploads/superadmin_default.jpg',
      userPassword: hashedPassword,
      userAccountType: 'Cuentadante',
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
      create: { groupName: roleName },
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
