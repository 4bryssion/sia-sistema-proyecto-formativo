// Seed del AMBIENTE DE PRUEBAS (Matriz de Casos de Prueba v6).
//
// Se ejecuta DESPUÉS de prisma/seed.js (que crea permisos, roles, catálogos base y
// el SuperAdmin) y SOLO contra la base de datos de pruebas:
//
//   npm run test:db:seed     (corre seed.js y luego este archivo, con .env.test)
//
// ⚠️ BORRA todos los datos de negocio de la base antes de cargar los de prueba,
// para que cada ejecución deje el ambiente en el mismo punto de partida. Por eso
// se niega a correr si el nombre de la base de datos no contiene "test".
//
// Qué deja cargado:
//   - Usuarios por rol y por estado (activo, inactivo, vigencia vencida, vigencia
//     futura, contraseña temporal). Hay usuarios ".ui" para probar en el navegador
//     y usuarios ".api" para Postman: la sesión es única por usuario, y usar el
//     mismo en los dos sitios a la vez termina en 409.
//   - Catálogos activos e inactivos (marcas, inventarios, grupo, categoría, tipo
//     de documento), cotizaciones, materiales de consumo y devolutivos.
//   - Préstamos en cada estado, devoluciones (en espera y autorizada), tareas y
//     notificaciones.
// Al terminar imprime las credenciales y los enlaces de firma de los préstamos
// pendientes.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { normalizarNombre } from '../src/shared/normalizeName.js';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = path.join(RAIZ, 'tests', 'fixtures');
const UPLOADS = path.join(RAIZ, 'uploads');
const PREFIJO_ARCHIVOS = 'seedtest-';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const nombreBase = (url) => {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return '';
  }
};

// Fecha de CALENDARIO (columna @db.Date) desplazada `dias` desde hoy. Se arma en
// UTC a partir de la fecha local para que en UTC-5 no se corra un día (mismo
// criterio que auth.service.js).
const dia = (dias = 0) => {
  const [y, m, d] = new Date().toLocaleDateString('en-CA').split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias));
};

// "pruebas.sii@gmail.com" + "admin.ui" → "pruebas.sii+admin.ui@gmail.com"
const correo = (alias) => {
  const base = process.env.TEST_EMAIL_BASE || 'pruebas@sii.test';
  const [local, dominio] = base.split('@');
  return `${local}+${alias}@${dominio}`.toLowerCase();
};

// Copia un archivo de tests/fixtures a uploads/ con un nombre único, y devuelve
// los datos que guardan las tablas de archivos.
const subirFixture = (archivo, mimeType) => {
  const origen = path.join(FIXTURES, archivo);
  if (!fs.existsSync(origen)) throw new Error(`Falta el archivo de prueba ${origen}`);
  const nombre = `${PREFIJO_ARCHIVOS}${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(archivo)}`;
  fs.copyFileSync(origen, path.join(UPLOADS, nombre));
  const hash = crypto.createHash('sha256').update(fs.readFileSync(origen)).digest('hex');
  return { url: `/uploads/${nombre}`, fileName: archivo, mimeType, hash };
};

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------

// alias → { nombre, apellido, grupo, cuenta, y opciones de estado }
const USUARIOS = [
  // Navegador (Caja Negra, Usabilidad, Ciclo de Negocio)
  { alias: 'admin.ui',       nombre: 'Laura',     apellido: 'Gómez',     grupo: 'Administrador', cuenta: 'Cuentadante' },
  { alias: 'instructor.ui',  nombre: 'Carlos',    apellido: 'Rodríguez', grupo: 'Instructor',    cuenta: 'Cuentadante' },
  { alias: 'instructor2.ui', nombre: 'Diana',     apellido: 'Martínez',  grupo: 'Instructor',    cuenta: 'Cuentadante' },
  { alias: 'invitado.ui',    nombre: 'Andrés',    apellido: 'López',     grupo: 'Invitado',      cuenta: 'Solidario' },
  // Postman (Integración, Seguridad, Integridad de BD)
  { alias: 'admin.api',      nombre: 'Paula',     apellido: 'Herrera',   grupo: 'Administrador', cuenta: 'Cuentadante' },
  { alias: 'instructor.api', nombre: 'Jorge',     apellido: 'Ramírez',   grupo: 'Instructor',    cuenta: 'Cuentadante' },
  { alias: 'invitado.api',   nombre: 'Valentina', apellido: 'Castro',    grupo: 'Invitado',      cuenta: 'Solidario' },
  // Estados especiales
  { alias: 'sinpermisos',    nombre: 'Mateo',     apellido: 'Vargas',    grupo: null,            cuenta: 'Solidario' },
  { alias: 'inactivo',       nombre: 'Camila',    apellido: 'Torres',    grupo: 'Invitado',      cuenta: 'Solidario', isActive: false },
  { alias: 'vencido',        nombre: 'Sebastián', apellido: 'Rojas',     grupo: 'Invitado',      cuenta: 'Solidario', fin: -1 },
  { alias: 'futuro',         nombre: 'Isabella',  apellido: 'Moreno',    grupo: 'Invitado',      cuenta: 'Solidario', inicio: 10 },
  { alias: 'temporal.ui',    nombre: 'Samuel',    apellido: 'Jiménez',   grupo: 'Invitado',      cuenta: 'Solidario', temporal: true },
  { alias: 'temporal.api',   nombre: 'Mariana',   apellido: 'Ortiz',     grupo: 'Invitado',      cuenta: 'Solidario', temporal: true },
];

const MARCAS = [
  { brandName: 'Truper', isActive: true },
  { brandName: 'Bosch', isActive: true },
  { brandName: 'Stanley', isActive: true },
  { brandName: 'Marca Inactiva Pruebas', isActive: false },
];

const INVENTARIOS = [
  { inventoryName: 'Almacén Principal', isActive: true },
  { inventoryName: 'Laboratorio de Sistemas', isActive: true },
  { inventoryName: 'Inventario Inactivo Pruebas', isActive: false },
];

// ---------------------------------------------------------------------------
// Limpieza
// ---------------------------------------------------------------------------

// Tablas de negocio que se vacían por completo. RESTART IDENTITY reinicia los ids
// en 1: así los ids que imprime el resumen (y que usa Postman) son siempre los
// mismos en cada ejecución.
const TABLAS_NEGOCIO = [
  'notifications', 'audit_log', 'devolution_request_items', 'devolution_requests',
  'loan_returns', 'loan_signatures', 'loan_materials', 'loans', 'tasks',
  'material_quotations', 'quotations', 'material_files', 'consumable_material_images',
  'material_accountables', 'returnable_materials', 'consumable_materials',
  'brands', 'inventories', 'password_reset_codes',
];

// Tablas donde se conservan las filas del seed base: tras borrar las de prueba,
// la secuencia se reajusta al id más alto que quedó.
const reajustarSecuencia = (tabla) =>
  prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('${tabla}', 'id'), COALESCE((SELECT MAX(id) FROM ${tabla}), 0) + 1, false)`,
  );

const limpiar = async () => {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLAS_NEGOCIO.join(', ')} RESTART IDENTITY CASCADE`);

  // Usuarios: se conserva solo el SuperAdmin del seed base.
  const superAdmin = await prisma.user.findUnique({ where: { userDocumentNumber: '1000000000' } });
  const otros = { id: { not: superAdmin?.id ?? 0 } };
  await prisma.userPermission.deleteMany({ where: { userId: otros.id } });
  await prisma.userGroup.deleteMany({ where: { userId: otros.id } });
  await prisma.user.deleteMany({ where: otros });
  if (superAdmin) {
    // Libera cualquier sesión abierta del SuperAdmin en ejecuciones anteriores
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { activeSessionJti: null, activeSessionExpiresAt: null, isActive: true },
    });
  }

  // Grupos, categorías y tipos de documento: se conservan los del seed base.
  await prisma.group.deleteMany({
    where: { groupName: { notIn: ['SuperAdmin', 'Administrador', 'Instructor', 'Invitado'] } },
  });
  await prisma.category.deleteMany({
    where: { categoryName: { notIn: ['Herramienta', 'Maquinaria y equipos', 'Muebles y enseres'] } },
  });
  await prisma.documentType.deleteMany({
    where: { documentName: { endsWith: '(pruebas)' } },
  });
  for (const tabla of ['users', 'groups', 'categories', 'document_types']) await reajustarSecuencia(tabla);
  // Reactiva lo que una prueba anterior pudo haber desactivado
  await prisma.group.updateMany({ data: { isActive: true } });
  await prisma.category.updateMany({ data: { isActive: true } });
  await prisma.documentType.updateMany({ data: { isActive: true } });

  // Archivos de ejecuciones anteriores de este seed
  if (fs.existsSync(UPLOADS)) {
    for (const f of fs.readdirSync(UPLOADS)) {
      if (f.startsWith(PREFIJO_ARCHIVOS)) fs.unlinkSync(path.join(UPLOADS, f));
    }
  }
};

// ---------------------------------------------------------------------------
// Carga
// ---------------------------------------------------------------------------

async function main() {
  const base = nombreBase(process.env.DATABASE_URL);
  if (!base.toLowerCase().includes('test')) {
    throw new Error(
      `La base de datos actual se llama "${base}". Este seed BORRA datos y solo corre contra una base `
      + 'de pruebas (su nombre debe contener "test"). Usa: npm run test:db:seed',
    );
  }
  const password = process.env.TEST_USERS_PASSWORD;
  if (!password) throw new Error('TEST_USERS_PASSWORD no está definida en .env.test.');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET no está definida en .env.test.');

  fs.mkdirSync(UPLOADS, { recursive: true });

  console.log(`Seed de pruebas sobre "${base}"...`);
  await limpiar();
  console.log('✓ Datos de negocio anteriores eliminados.');

  // ---- Catálogos extra (activos e inactivos) ----
  await prisma.documentType.create({
    data: { documentName: 'Documento Inactivo (pruebas)', description: 'Tipo de documento desactivado para pruebas', isActive: false },
  });
  await prisma.category.create({
    data: {
      categoryName: 'Categoría Inactiva Pruebas',
      categoryNameNormalized: normalizarNombre('Categoría Inactiva Pruebas'),
      isActive: false,
    },
  });
  const grupoPruebas = await prisma.group.create({
    data: { groupName: 'Grupo de Pruebas', groupNameNormalized: normalizarNombre('Grupo de Pruebas') },
  });
  const permsGrupo = await prisma.permission.findMany({
    where: { permissionCodename: { in: ['list_brands', 'list_inventories'] } },
  });
  for (const perm of permsGrupo) {
    await prisma.groupPermission.create({ data: { groupId: grupoPruebas.id, permissionId: perm.id } });
  }
  await prisma.group.create({
    data: { groupName: 'Grupo Inactivo Pruebas', groupNameNormalized: normalizarNombre('Grupo Inactivo Pruebas'), isActive: false },
  });

  const marcas = {};
  for (const m of MARCAS) {
    marcas[m.brandName] = await prisma.brand.create({
      data: { ...m, brandNameNormalized: normalizarNombre(m.brandName) },
    });
  }
  const inventarios = {};
  for (const i of INVENTARIOS) {
    inventarios[i.inventoryName] = await prisma.inventory.create({
      data: { ...i, inventoryNameNormalized: normalizarNombre(i.inventoryName) },
    });
  }
  console.log('✓ Catálogos de prueba (marcas, inventarios, grupo, categoría y tipo de documento).');

  // ---- Usuarios ----
  const cedula = await prisma.documentType.findUnique({ where: { documentName: 'Cédula de Ciudadanía' } });
  const grupos = Object.fromEntries(
    (await prisma.group.findMany()).map((g) => [g.groupName, g]),
  );
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const u = {};
  let documento = 9100000001;
  for (const def of USUARIOS) {
    const user = await prisma.user.create({
      data: {
        documentTypeId: cedula.id,
        userFirstName: def.nombre,
        userLastName: def.apellido,
        userDocumentNumber: String(documento),
        userStartDate: dia(def.inicio ?? -30),
        userEndDate: dia(def.fin ?? 365),
        userEmail: correo(def.alias),
        userPhone: `300${String(documento).slice(-7)}`,
        userAddress: 'Calle 10 # 20-30, Medellín',
        userPassword: hash,
        userAccountType: def.cuenta,
        isActive: def.isActive ?? true,
        mustChangePassword: def.temporal ?? false,
        dataPolicyAcceptedAt: new Date(),
      },
    });
    if (def.grupo) {
      await prisma.userGroup.create({ data: { userId: user.id, groupId: grupos[def.grupo].id } });
    }
    u[def.alias] = user;
    documento += 1;
  }
  console.log(`✓ ${USUARIOS.length} usuarios de prueba.`);

  // ---- Cotizaciones ----
  const cot = [];
  for (const [n, activa] of [[1, true], [2, true], [3, false]]) {
    const f = subirFixture(`cotizacion-${n}.pdf`, 'application/pdf');
    cot.push(await prisma.quotation.create({
      data: {
        fileName: f.fileName, fileUrl: f.url, mimeType: f.mimeType, fileHash: f.hash,
        uploadedBy: u['admin.ui'].id, isActive: activa,
      },
    }));
  }
  console.log('✓ 3 cotizaciones (2 activas, 1 deshabilitada).');

  // ---- Materiales ----
  // stock = cantidad que queda DESPUÉS de los préstamos de más abajo, para que el
  // inventario y los préstamos cuenten la misma historia.
  const crearMaterial = async (def) => {
    const img = subirFixture('imagen-valida.png', 'image/png');
    const ficha = subirFixture('ficha-tecnica.pdf', 'application/pdf');
    const material = await prisma.consumableMaterial.create({
      data: {
        brandId: def.marca ? marcas[def.marca].id : null,
        inventoryId: inventarios[def.inventario ?? 'Almacén Principal'].id,
        senaPlate: def.placa ?? null,
        materialName: def.nombre,
        quantity: def.cantidad ?? null,
        unitPrice: def.precio,
        totalPrice: def.precio * (def.cantidadTotal ?? def.cantidad ?? 1),
        status: def.estado ?? 'Disponible',
        description: def.descripcion,
        purchaseDate: dia(-120),
        entryDate: dia(-110),
        location: def.ubicacion ?? 'Bodega 1',
        isActive: def.isActive ?? true,
        accountables: { create: (def.cuentadantes ?? ['instructor.ui']).map((a) => ({ userId: u[a].id })) },
        quotations: { create: [{ quotationId: cot[def.cotizacion ?? 0].id }] },
        images: { create: [{ imageUrl: img.url, fileName: img.fileName, mimeType: img.mimeType, sortOrder: 0 }] },
        technicalSheets: { create: [{ fileUrl: ficha.url, fileName: ficha.fileName, mimeType: ficha.mimeType, sortOrder: 0 }] },
      },
    });
    if (def.categoria) {
      const categoria = await prisma.category.findUnique({ where: { categoryName: def.categoria } });
      await prisma.returnableMaterial.create({
        data: {
          id: material.id,
          categoryId: categoria.id,
          model: def.modelo ?? null,
          serial: def.serial ?? null,
          dimensions: def.dimensiones ?? null,
        },
      });
    }
    return material;
  };

  const m = {};
  // Consumo (por cantidad, sin placa)
  m.resma = await crearMaterial({
    nombre: 'Resma de papel carta', marca: 'Truper', cantidad: 35, cantidadTotal: 50, precio: 22000,
    descripcion: 'Resma de 500 hojas tamaño carta', cuentadantes: ['instructor.ui', 'admin.ui'],
  });
  m.cable = await crearMaterial({
    nombre: 'Cable HDMI 2 m', marca: 'Bosch', cantidad: 8, cantidadTotal: 10, precio: 18000,
    descripcion: 'Cable HDMI 2.0 de 2 metros', inventario: 'Laboratorio de Sistemas', cotizacion: 1,
  });
  m.marcadores = await crearMaterial({
    nombre: 'Marcadores borrables (caja x12)', cantidad: 1, cantidadTotal: 3, precio: 35000,
    descripcion: 'Caja de 12 marcadores para tablero',
  });
  m.toner = await crearMaterial({
    nombre: 'Tóner impresora láser', marca: 'Stanley', cantidad: 5, precio: 180000,
    descripcion: 'Tóner negro para impresora láser (material desactivado)', isActive: false,
  });
  // Devolutivos (serializados: placa SENA, quantity null)
  m.taladro = await crearMaterial({
    nombre: 'Taladro percutor', marca: 'Bosch', placa: 'SENA-TEST-0001', precio: 450000,
    descripcion: 'Taladro percutor 750W', categoria: 'Herramienta', modelo: 'GSB 13 RE', serial: 'SER-TEST-0001',
  });
  m.portatil = await crearMaterial({
    nombre: 'Portátil Lenovo ThinkPad', placa: 'SENA-TEST-0002', precio: 3200000,
    descripcion: 'Portátil 14 pulgadas, 16GB RAM', categoria: 'Maquinaria y equipos', modelo: 'T14', serial: 'SER-TEST-0002',
    inventario: 'Laboratorio de Sistemas', cotizacion: 1,
  });
  m.mesa = await crearMaterial({
    nombre: 'Mesa plegable', placa: 'SENA-TEST-0003', precio: 380000,
    descripcion: 'Mesa plegable para eventos', categoria: 'Muebles y enseres', dimensiones: '180 x 75 x 74 cm',
  });
  m.proyector = await crearMaterial({
    nombre: 'Proyector Epson', placa: 'SENA-TEST-0004', precio: 2100000, estado: 'Mantenimiento',
    descripcion: 'Proyector 3LCD (en mantenimiento)', categoria: 'Maquinaria y equipos', modelo: 'PowerLite',
  });
  m.multimetro = await crearMaterial({
    nombre: 'Multímetro digital', marca: 'Truper', placa: 'SENA-TEST-0005', precio: 150000, estado: 'En_prestamo',
    descripcion: 'Multímetro digital de bolsillo', categoria: 'Herramienta', serial: 'SER-TEST-0005',
  });
  m.camara = await crearMaterial({
    nombre: 'Cámara Canon', placa: 'SENA-TEST-0006', precio: 2800000, estado: 'En_prestamo',
    descripcion: 'Cámara réflex digital', categoria: 'Maquinaria y equipos', modelo: 'EOS Rebel', serial: 'SER-TEST-0006',
  });
  console.log('✓ 10 materiales (4 de consumo, 6 devolutivos) con imagen, ficha, cotización y cuentadante.');

  // ---- Préstamos ----
  const crearPrestamo = async ({ estado, tipo = 'Interno', grupo = null, prestador, receptor, receptorExterno, materiales, activo = true, firmado }) => {
    const loan = await prisma.loan.create({
      data: {
        apprenticeGroup: grupo,
        loanType: tipo,
        useJustification: `Préstamo de prueba (${estado})`,
        returnDate: dia(estado === 'Finalizado' ? -5 : 15),
        status: estado,
        isActive: activo,
        materials: {
          create: materiales.map(([mat, cantidad, devuelto = 0]) => ({
            materialId: mat.id, borrowedQuantity: cantidad, returnedQuantity: devuelto,
          })),
        },
        signatures: {
          create: [
            { party: 'Prestador', userId: u[prestador].id, signed: firmado, signedAt: firmado ? new Date() : null },
            receptorExterno
              ? { party: 'Receptor', userId: null, externalEmail: receptorExterno, signed: firmado, signedAt: firmado ? new Date() : null }
              : { party: 'Receptor', userId: u[receptor].id, signed: firmado, signedAt: firmado ? new Date() : null },
          ],
        },
      },
    });
    return loan;
  };

  const p = {};
  p.pendienteInterno = await crearPrestamo({
    estado: 'Pendiente_confirmacion', grupo: 2758001, prestador: 'instructor.ui', receptor: 'invitado.ui', firmado: false,
    materiales: [[m.cable, 2], [m.camara, 1]],
  });
  p.pendienteExterno = await crearPrestamo({
    estado: 'Pendiente_confirmacion', tipo: 'Externo', prestador: 'instructor.ui', receptorExterno: correo('externo'), firmado: false,
    materiales: [[m.resma, 5]],
  });
  p.activo = await crearPrestamo({
    estado: 'Activo', grupo: 2758001, prestador: 'instructor.ui', receptor: 'invitado.ui', firmado: true,
    materiales: [[m.multimetro, 1], [m.resma, 10]],
  });
  p.activoConDevolucion = await crearPrestamo({
    estado: 'Activo', prestador: 'instructor2.ui', receptor: 'invitado.ui', firmado: true,
    materiales: [[m.marcadores, 2]],
  });
  p.finalizado = await crearPrestamo({
    estado: 'Finalizado', prestador: 'instructor.ui', receptor: 'invitado.ui', firmado: true,
    materiales: [[m.portatil, 1, 1]],
  });
  // Desactivado con el toggle: el stock ya se restauró, por eso no descuenta nada arriba
  p.desactivado = await crearPrestamo({
    estado: 'Activo', prestador: 'instructor2.ui', receptor: 'invitado.ui', firmado: true, activo: false,
    materiales: [[m.mesa, 1]],
  });
  console.log('✓ 6 préstamos (2 pendientes de firma, 2 activos, 1 finalizado, 1 desactivado).');

  // ---- Devoluciones ----
  await prisma.devolutionRequest.create({
    data: {
      loanId: p.activoConDevolucion.id, type: 'Parcial', status: 'En_espera', requestedById: u['invitado.ui'].id,
      items: { create: [{ materialId: m.marcadores.id, returnedQuantity: 1, requesterObservations: 'Sobró una caja' }] },
    },
  });
  await prisma.devolutionRequest.create({
    data: {
      loanId: p.finalizado.id, type: 'Total', status: 'Autorizada', requestedById: u['invitado.ui'].id,
      authorizedById: u['admin.ui'].id, authorizedAt: new Date(),
      items: {
        create: [{
          materialId: m.portatil.id, returnedQuantity: 1, materialStatus: 'Disponible',
          requesterObservations: 'Se entrega completo', authorizerObservations: 'Recibido en buen estado',
        }],
      },
    },
  });
  await prisma.loanReturn.create({
    data: { loanId: p.finalizado.id, materialId: m.portatil.id, remainingQuantity: null, observations: 'Recibido en buen estado' },
  });
  console.log('✓ 2 devoluciones (1 en espera de autorizar, 1 autorizada).');

  // ---- Tareas ----
  const tareas = [
    { userId: u['invitado.ui'].id, taskName: 'Inventario de bodega 1', description: 'Contar los materiales de la bodega 1', endDate: dia(7) },
    { userId: u['invitado.ui'].id, taskName: 'Etiquetar cables', description: 'Etiquetar los cables HDMI del laboratorio', endDate: dia(3), status: 'completada' },
    { userId: u['invitado.ui'].id, taskName: 'Revisar proyector', description: 'Reportar el estado del proyector', endDate: dia(-5), status: 'no_completada' },
    // Vencida pero todavía en progreso: al LISTAR tareas debe pasar sola a no_completada
    { userId: u['invitado.ui'].id, taskName: 'Ordenar estantería', description: 'Tarea vencida que aún figura en progreso', endDate: dia(-2) },
    { userId: u['instructor.ui'].id, taskName: 'Preparar práctica de redes', description: 'Tarea asignada a otro usuario', endDate: dia(10) },
    { userId: u['invitado.ui'].id, taskName: 'Tarea desactivada', description: 'Tarea con isActive en false', endDate: dia(5), isActive: false },
  ];
  for (const t of tareas) await prisma.task.create({ data: t });
  console.log(`✓ ${tareas.length} tareas.`);

  // ---- Notificaciones ----
  await prisma.notification.createMany({
    data: [
      { title: 'Préstamo realizado', description: `Préstamo #${p.pendienteInterno.id} (interno) creado (pendiente de firmas).`, severity: 'Informativa', module: 'loans', userId: u['instructor.ui'].id },
      { title: 'Devolución solicitada', description: `Devolución parcial del préstamo #${p.activoConDevolucion.id} en espera de autorizar.`, severity: 'Advertencia', module: 'devolutions', userId: u['invitado.ui'].id },
      { title: 'Tarea asignada', description: 'Se te asignó la tarea "Inventario de bodega 1".', severity: 'Informativa', module: 'tasks', userId: u['admin.ui'].id, recipientId: u['invitado.ui'].id },
    ],
  });
  console.log('✓ 3 notificaciones.');

  // ---- Resumen ----
  const firmar = (loanId, party) => {
    const token = jwt.sign({ loanId, party, purpose: 'loan_signature' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/loans/sign?token=${token}`;
  };

  console.log('\n================ USUARIOS DE PRUEBA ================');
  console.log(`Contraseña de todos: ${password}   (SuperAdmin: superadmin@sia.local / ADMIN_PASSWORD)`);
  console.table(USUARIOS.map((d) => ({
    alias: d.alias,
    correo: u[d.alias].userEmail,
    grupo: d.grupo ?? '(sin grupo)',
    estado: d.isActive === false ? 'inactivo'
      : d.fin ? 'vigencia vencida'
        : d.inicio ? 'vigencia futura'
          : d.temporal ? 'contraseña temporal' : 'activo',
  })));

  console.log('\n======== ENLACES DE FIRMA (préstamos pendientes, válidos 7 días) ========');
  console.log(`Préstamo #${p.pendienteInterno.id} (interno)`);
  console.log(`  Prestador: ${firmar(p.pendienteInterno.id, 'Prestador')}`);
  console.log(`  Receptor:  ${firmar(p.pendienteInterno.id, 'Receptor')}`);
  console.log(`Préstamo #${p.pendienteExterno.id} (externo, receptor ${correo('externo')})`);
  console.log(`  Prestador: ${firmar(p.pendienteExterno.id, 'Prestador')}`);
  console.log(`  Receptor:  ${firmar(p.pendienteExterno.id, 'Receptor')}`);

  console.log('\n================ IDS ÚTILES PARA POSTMAN ================');
  console.table({
    ...Object.fromEntries(Object.entries(p).map(([k, v]) => [`préstamo ${k}`, v.id])),
    ...Object.fromEntries(Object.entries(m).map(([k, v]) => [`material ${k}`, v.id])),
    'cotización activa': cot[0].id,
    'cotización deshabilitada': cot[2].id,
    'grupo de pruebas': grupoPruebas.id,
  });
  console.log('\nSeed de pruebas completado.');
}

main()
  .catch((e) => {
    console.error('Error en seed de pruebas:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
