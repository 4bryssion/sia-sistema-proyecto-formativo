import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ---- Catálogo de permisos realineado a los endpoints reales ----
const initialPermissions = [
  // Tipos de documento (gestionado por SADMIN)
  { permissionName: 'ver_tipos_documento',                  description: 'Ver listado de tipos de documento' },
  { permissionName: 'crear_tipo_documento',                 description: 'Crear nuevo tipo de documento' },
  { permissionName: 'editar_tipo_documento',                description: 'Editar tipo de documento existente' },
  { permissionName: 'habilitar_deshabilitar_tipo_documento',description: 'Habilitar/Deshabilitar tipo de documento' },

  // Marcas
  { permissionName: 'ver_marcas',                description: 'Ver listado de marcas' },
  { permissionName: 'crear_marca',               description: 'Crear nueva marca' },
  { permissionName: 'editar_marca',              description: 'Editar marca existente' },
  { permissionName: 'habilitar_deshabilitar_marca', description: 'Habilitar/Deshabilitar marca' },

  // Categorías (gestionado por SADMIN)
  { permissionName: 'ver_categorias',                description: 'Ver listado de categorías' },
  { permissionName: 'crear_categoria',               description: 'Crear nueva categoría' },
  { permissionName: 'editar_categoria',              description: 'Editar categoría existente' },
  { permissionName: 'habilitar_deshabilitar_categoria', description: 'Habilitar/Deshabilitar categoría' },

  // Permisos
  { permissionName: 'ver_permisos',                description: 'Ver listado de permisos del sistema' },
  { permissionName: 'crear_permiso',               description: 'Crear nuevo permiso' },
  { permissionName: 'editar_permiso',              description: 'Editar permiso existente' },
  { permissionName: 'habilitar_deshabilitar_permiso', description: 'Habilitar/Deshabilitar permiso' },

  // Grupos (roles)
  { permissionName: 'ver_grupos',              description: 'Ver listado de grupos' },
  { permissionName: 'crear_grupo',             description: 'Crear nuevo grupo' },
  { permissionName: 'editar_grupo',            description: 'Editar grupo existente' },
  { permissionName: 'habilitar_deshabilitar_grupo', description: 'Habilitar/Deshabilitar grupo' },
  { permissionName: 'asignar_permiso_grupo',   description: 'Asignar un permiso a un grupo' },
  { permissionName: 'remover_permiso_grupo',   description: 'Remover un permiso de un grupo' },

  // Usuarios
  { permissionName: 'ver_usuarios',                description: 'Ver listado de usuarios' },
  { permissionName: 'crear_usuario',               description: 'Crear nuevo usuario' },
  { permissionName: 'editar_usuario',              description: 'Editar usuario existente' },
  { permissionName: 'habilitar_deshabilitar_usuario', description: 'Habilitar/Deshabilitar usuario' },
  { permissionName: 'asignar_grupo_usuario',       description: 'Asignar un grupo a un usuario' },
  { permissionName: 'remover_grupo_usuario',       description: 'Remover un grupo de un usuario' },
  { permissionName: 'asignar_permiso_usuario',     description: 'Asignar permiso directo a usuario' },
  { permissionName: 'remover_permiso_usuario',     description: 'Remover permiso directo de usuario' },
  { permissionName: 'generar_reporte_usuarios',    description: 'Generar reporte de usuarios' },

  // Materiales de consumo
  { permissionName: 'ver_materiales_consumo',                description: 'Ver materiales de consumo' },
  { permissionName: 'crear_material_consumo',                description: 'Crear material de consumo' },
  { permissionName: 'editar_material_consumo',               description: 'Editar material de consumo' },
  { permissionName: 'habilitar_deshabilitar_material_consumo', description: 'Habilitar/Deshabilitar material de consumo' },
  { permissionName: 'generar_reporte_materiales_consumo',    description: 'Generar reporte de materiales de consumo' },

  // Materiales devolutivos
  { permissionName: 'ver_materiales_devolutivo',                description: 'Ver materiales devolutivos' },
  { permissionName: 'crear_material_devolutivo',               description: 'Crear material devolutivo' },
  { permissionName: 'editar_material_devolutivo',              description: 'Editar material devolutivo' },
  { permissionName: 'habilitar_deshabilitar_material_devolutivo', description: 'Habilitar/Deshabilitar material devolutivo' },
  { permissionName: 'generar_reporte_materiales_devolutivo',    description: 'Generar reporte de materiales devolutivos' },

  // Préstamos
  { permissionName: 'ver_prestamos',                description: 'Ver listado de préstamos' },
  { permissionName: 'crear_prestamo',               description: 'Registrar nuevo préstamo' },
  { permissionName: 'actualizar_prestamo',          description: 'Actualizar préstamo activo' },
  { permissionName: 'habilitar_deshabilitar_prestamo', description: 'Habilitar/Deshabilitar préstamo' },
  { permissionName: 'generar_reporte_prestamos',    description: 'Generar reporte de préstamos' },

  // Retornos de préstamo (inmutables)
  { permissionName: 'ver_retornos_prestamo',     description: 'Ver retornos de préstamos' },
  { permissionName: 'crear_retorno_prestamo',    description: 'Registrar retorno de préstamo' },

  // Tareas
  { permissionName: 'ver_tareas',                description: 'Ver listado de tareas' },
  { permissionName: 'crear_tarea',               description: 'Crear nueva tarea' },
  { permissionName: 'editar_tarea',              description: 'Editar tarea existente' },
  { permissionName: 'habilitar_deshabilitar_tarea', description: 'Habilitar/Deshabilitar tarea' },
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
const roleMatrix = {
  Administrador: [
    // lectura para selects
    'ver_tipos_documento', 'ver_categorias',
    // marcas (CRUD)
    'ver_marcas', 'crear_marca', 'editar_marca', 'habilitar_deshabilitar_marca',
    // usuarios
    'ver_usuarios', 'crear_usuario', 'editar_usuario', 'habilitar_deshabilitar_usuario', 'generar_reporte_usuarios',
    // panel de accesos (ver + asignaciones; NO crea/edita/togglea grupos ni permisos)
    'ver_grupos', 'ver_permisos',
    'asignar_grupo_usuario', 'remover_grupo_usuario',
    'asignar_permiso_usuario', 'remover_permiso_usuario',
    'asignar_permiso_grupo', 'remover_permiso_grupo',
    // materiales de consumo
    'ver_materiales_consumo', 'crear_material_consumo', 'editar_material_consumo',
    'habilitar_deshabilitar_material_consumo', 'generar_reporte_materiales_consumo',
    // materiales devolutivos
    'ver_materiales_devolutivo', 'crear_material_devolutivo', 'editar_material_devolutivo',
    'habilitar_deshabilitar_material_devolutivo', 'generar_reporte_materiales_devolutivo',
    // préstamos
    'ver_prestamos', 'crear_prestamo', 'actualizar_prestamo', 'habilitar_deshabilitar_prestamo', 'generar_reporte_prestamos',
    // retornos
    'ver_retornos_prestamo', 'crear_retorno_prestamo',
    // tareas
    'ver_tareas', 'crear_tarea', 'editar_tarea', 'habilitar_deshabilitar_tarea',
  ],

  Instructor: [
    // lectura para selects
    'ver_marcas', 'ver_categorias',
    // materiales de consumo
    'ver_materiales_consumo', 'crear_material_consumo', 'editar_material_consumo',
    'habilitar_deshabilitar_material_consumo', 'generar_reporte_materiales_consumo',
    // materiales devolutivos
    'ver_materiales_devolutivo', 'crear_material_devolutivo', 'editar_material_devolutivo',
    'habilitar_deshabilitar_material_devolutivo', 'generar_reporte_materiales_devolutivo',
    // préstamos
    'ver_prestamos', 'crear_prestamo', 'actualizar_prestamo', 'generar_reporte_prestamos',
    // retornos
    'ver_retornos_prestamo', 'crear_retorno_prestamo',
  ],

  Invitado: [
    'ver_materiales_devolutivo', 'generar_reporte_materiales_devolutivo',
    'ver_materiales_consumo', 'generar_reporte_materiales_consumo',
    'ver_prestamos',
    'ver_retornos_prestamo', 'crear_retorno_prestamo',
  ],
};

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD no está definida en .env — no se puede ejecutar el seed.');
  }

  console.log('Iniciando seeds...');

  // 1. Permisos
  for (const permiso of initialPermissions) {
    await prisma.permission.upsert({
      where: { permissionName: permiso.permissionName },
      update: { description: permiso.description },
      create: permiso,
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
  for (const [roleName, permNames] of Object.entries(roleMatrix)) {
    const group = await prisma.group.upsert({
      where: { groupName: roleName },
      update: {},
      create: { groupName: roleName },
    });

    const perms = await prisma.permission.findMany({
      where: { permissionName: { in: permNames } },
    });

    // Seguridad: todos los nombres deben existir en el catálogo (P12)
    if (perms.length !== permNames.length) {
      const found = perms.map((p) => p.permissionName);
      const missing = permNames.filter((n) => !found.includes(n));
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
