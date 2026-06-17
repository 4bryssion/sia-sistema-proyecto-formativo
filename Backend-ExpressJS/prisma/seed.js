import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const initialPermissions = [
  // Tipos de documento
  { permissionName: 'ver_tipos_documento',     description: 'Ver listado de tipos de documento' },
  { permissionName: 'crear_tipo_documento',    description: 'Crear nuevo tipo de documento' },
  { permissionName: 'editar_tipo_documento',   description: 'Editar tipo de documento existente' },
  { permissionName: 'eliminar_tipo_documento', description: 'Eliminar tipo de documento' },

  // Marcas
  { permissionName: 'ver_marcas',     description: 'Ver listado de marcas' },
  { permissionName: 'crear_marca',    description: 'Crear nueva marca' },
  { permissionName: 'editar_marca',   description: 'Editar marca existente' },
  { permissionName: 'eliminar_marca', description: 'Eliminar marca' },

  // Categorías
  { permissionName: 'ver_categorias',     description: 'Ver listado de categorías' },
  { permissionName: 'crear_categoria',    description: 'Crear nueva categoría' },
  { permissionName: 'editar_categoria',   description: 'Editar categoría existente' },
  { permissionName: 'eliminar_categoria', description: 'Eliminar categoría' },

  // Permisos
  { permissionName: 'ver_permisos',     description: 'Ver listado de permisos del sistema' },
  { permissionName: 'crear_permiso',    description: 'Crear nuevo permiso' },
  { permissionName: 'editar_permiso',   description: 'Editar permiso existente' },
  { permissionName: 'eliminar_permiso', description: 'Eliminar permiso' },

  // Grupos
  { permissionName: 'ver_grupos',              description: 'Ver listado de grupos' },
  { permissionName: 'crear_grupo',             description: 'Crear nuevo grupo' },
  { permissionName: 'editar_grupo',            description: 'Editar grupo existente' },
  { permissionName: 'eliminar_grupo',          description: 'Eliminar grupo' },
  { permissionName: 'asignar_permiso_grupo',   description: 'Asignar un permiso a un grupo' },
  { permissionName: 'remover_permiso_grupo',   description: 'Remover un permiso de un grupo' },

  // Usuarios
  { permissionName: 'ver_usuarios',             description: 'Ver listado de usuarios' },
  { permissionName: 'crear_usuario',            description: 'Crear nuevo usuario' },
  { permissionName: 'editar_usuario',           description: 'Editar usuario existente' },
  { permissionName: 'eliminar_usuario',         description: 'Eliminar usuario' },
  { permissionName: 'asignar_grupo_usuario',    description: 'Asignar un grupo a un usuario' },
  { permissionName: 'remover_grupo_usuario',    description: 'Remover un grupo de un usuario' },
  { permissionName: 'asignar_permiso_usuario',  description: 'Asignar permiso directo a usuario' },
  { permissionName: 'remover_permiso_usuario',  description: 'Remover permiso directo de usuario' },

  // Materiales de consumo
  { permissionName: 'ver_materiales_consumo',    description: 'Ver materiales de consumo' },
  { permissionName: 'crear_material_consumo',    description: 'Crear material de consumo' },
  { permissionName: 'editar_material_consumo',   description: 'Editar material de consumo' },
  { permissionName: 'eliminar_material_consumo', description: 'Eliminar material de consumo' },

  // Materiales devolutivos
  { permissionName: 'ver_materiales_devolutivo',    description: 'Ver materiales devolutivos' },
  { permissionName: 'crear_material_devolutivo',    description: 'Crear material devolutivo' },
  { permissionName: 'editar_material_devolutivo',   description: 'Editar material devolutivo' },
  { permissionName: 'eliminar_material_devolutivo', description: 'Eliminar material devolutivo' },

  // Préstamos
  { permissionName: 'ver_prestamos',     description: 'Ver listado de préstamos' },
  { permissionName: 'crear_prestamo',    description: 'Registrar nuevo préstamo' },
  { permissionName: 'eliminar_prestamo', description: 'Eliminar préstamo' },

  // Retornos de préstamo
  { permissionName: 'ver_retornos_prestamo',     description: 'Ver retornos de préstamos' },
  { permissionName: 'crear_retorno_prestamo',    description: 'Registrar retorno de préstamo' },
  { permissionName: 'eliminar_retorno_prestamo', description: 'Eliminar retorno de préstamo' },

  // Tareas
  { permissionName: 'ver_tareas',     description: 'Ver listado de tareas' },
  { permissionName: 'crear_tarea',    description: 'Crear nueva tarea' },
  { permissionName: 'editar_tarea',   description: 'Editar tarea existente' },
  { permissionName: 'eliminar_tarea', description: 'Eliminar tarea' },
];

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
      update: {},
      create: permiso,
    });
  }
  console.log(`✓ ${initialPermissions.length} permisos creados/verificados.`);

  // 2. Tipo de documento inicial
  const docType = await prisma.documentType.upsert({
    where: { documentName: 'Cédula de Ciudadanía' },
    update: {},
    create: { documentName: 'Cédula de Ciudadanía', description: 'Documento de identidad colombiano' },
  });
  console.log('✓ Tipo de documento creado/verificado.');

  // 3. Grupo administrador
  const adminGroup = await prisma.group.upsert({
    where: { groupName: 'Administrador' },
    update: {},
    create: { groupName: 'Administrador' },
  });
  console.log('✓ Grupo administrador creado/verificado.');

  // 4. Asignar todos los permisos al grupo admin
  const permissions = await prisma.permission.findMany();
  for (const perm of permissions) {
    await prisma.groupPermission.upsert({
      where: { groupId_permissionId: { groupId: adminGroup.id, permissionId: perm.id } },
      update: {},
      create: { groupId: adminGroup.id, permissionId: perm.id },
    });
  }
  console.log('✓ Permisos asignados al grupo administrador.');

  // 5. Usuario administrador
  const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  const adminUser = await prisma.user.upsert({
    where: { userDocumentNumber: '1000000000' },
    update: {},
    create: {
      documentTypeId: docType.id,
      userFirstName: 'Admin',
      userLastName: 'Sistema',
      userDocumentNumber: '1000000000',
      userEndDate: new Date('2030-12-31'),
      userEmail: 'admin@sia.local',
      userPhone: '0000000000',
      userAddress: 'Sistema',
      userPhoto: '/uploads/admin_default.jpg',
      userPassword: hashedPassword,
      userAccountType: 'Cuentadante',
    },
  });
  console.log('✓ Usuario administrador creado/verificado.');

  // 6. Asignar usuario al grupo admin
  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: adminUser.id, groupId: adminGroup.id } },
    update: {},
    create: { userId: adminUser.id, groupId: adminGroup.id },
  });
  console.log('✓ Usuario asignado al grupo administrador.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })

  .finally(() => prisma.$disconnect());
