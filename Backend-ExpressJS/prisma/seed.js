import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
// (p50) La misma normalización que usa el backend. El seed la necesita porque
// la columna normalizada es NOT NULL y no tiene valor por defecto: se calcula,
// no se inventa.
import { normalizarNombre } from '../src/shared/normalizeName.js';
// (p51) El catálogo de permisos (content types, permisos y matriz de roles)
// vive aparte: lo comparte con `sincronizar-permisos.js`.
import { contentTypes, initialPermissions, roleMatrix, ROLES_DEL_SISTEMA } from './permissionCatalog.js';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;


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
// (p53) Las tres son los TIPOS de material: `isMaterialType` las separa de las
// categorías que crea el usuario, que son las que alimentan el otro select del
// formulario de material.
const categories = [
  { categoryName: 'Herramienta',         requiresDimensions: false, isMaterialType: true }, // placa SENA e ID opcionales
  { categoryName: 'Maquinaria y equipos', requiresDimensions: false, isMaterialType: true },
  { categoryName: 'Muebles y enseres',   requiresDimensions: true,  isMaterialType: true },  // única que solicita dimensiones
];

// (p53) Ajustes del sistema con los que arranca una base nueva. El correo de
// soporte estaba escrito en el frontend como constante; ahora es un dato que se
// edita desde «Mi perfil» y que el login lee sin sesión.
const systemSettings = [
  { settingKey: 'support_email', settingValue: 'superadmin@sia.local' },
];

// ---- Matriz de permisos por rol (P13) ----
// Derivada del xlsx de requerimientos + decisiones acordadas.
// (Fix post-P37) La matriz referencia permissionCodename (identificador estable),
// ya que permissionName ahora es etiqueta visual y puede cambiar.

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
      // (p51) `isRestricted` viaja desde el catálogo: es una propiedad del
      // permiso, no una decisión de quien siembra.
      update: { permissionName: permiso.permissionName, contentTypeId, isRestricted: permiso.restricted === true },
      create: {
        permissionName: permiso.permissionName,
        permissionCodename: permiso.permissionCodename,
        contentTypeId,
        isRestricted: permiso.restricted === true,
      },
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
      // (p53) `isMaterialType` también en el update, por lo mismo que `isSystem`
      // en el grupo SuperAdmin: una base sembrada antes de la migración p53
      // tiene las tres sin marcar, y un update vacío las dejaría así, con los
      // dos selects del formulario de material vacíos.
      update: { isMaterialType: cat.isMaterialType },
      create: { ...cat, categoryNameNormalized: normalizarNombre(cat.categoryName) },
    });
  }
  console.log(`✓ ${categories.length} categorías creadas/verificadas.`);

  // 3.1 Ajustes del sistema. `update: {}` a propósito: si alguien ya cambió el
  // correo de soporte desde «Mi perfil», re-sembrar no se lo puede pisar.
  for (const ajuste of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { settingKey: ajuste.settingKey },
      update: {},
      create: ajuste,
    });
  }
  console.log(`✓ ${systemSettings.length} ajuste(s) del sistema verificado(s).`);

  // 4. Grupo SuperAdmin (SADMIN primigenio)
  const superAdminGroup = await prisma.group.upsert({
    where: { groupName: 'SuperAdmin' },
    // (p51) `isSystem` también en el update: una base sembrada antes de la
    // migración p51 tiene el grupo sin marcar, y un update vacío lo dejaría así.
    update: { isSystem: true },
    create: {
      groupName: 'SuperAdmin',
      groupNameNormalized: normalizarNombre('SuperAdmin'),
      isSystem: true,
    },
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
    const esDelSistema = ROLES_DEL_SISTEMA.includes(roleName);
    const group = await prisma.group.upsert({
      where: { groupName: roleName },
      update: { isSystem: esDelSistema },
      create: {
        groupName: roleName,
        groupNameNormalized: normalizarNombre(roleName),
        isSystem: esDelSistema,
      },
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
