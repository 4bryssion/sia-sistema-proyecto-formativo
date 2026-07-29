// Datos de demostración: marcas, usuarios, materiales (consumibles y
// devolutivos) y tareas.
//
// Va aparte de `seed.js` a propósito: aquel crea lo que el sistema NECESITA para
// arrancar (permisos, roles, catálogos, SuperAdmin) y debe poder ejecutarse en
// cualquier entorno. Esto es relleno para probar y sustentar, y se borra entero
// con `--limpiar`.
//
//   node prisma/seed-demo.js            → crea o actualiza los datos
//   node prisma/seed-demo.js --limpiar  → los borra (filas y archivos)
//
// Es idempotente: cada registro se busca por su clave natural antes de crearlo,
// así que correrlo dos veces no duplica nada.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { crearPdfSimple } from './demoPdf.js';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Contraseña común a todos los usuarios de demostración
const PASSWORD_DEMO = '12345678Sa?';

// Prefijo de TODOS los archivos que crea este script. Es también la marca que
// permite reconocer —y borrar— los registros de demostración sin tocar los reales.
const PREFIJO = 'demo_';

const UPLOADS = path.resolve('uploads');
const ASSETS = path.resolve('prisma', 'demo-assets');

// ---------------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------------

// Cada registro se lleva su PROPIA copia de la imagen aunque todas sean la misma
// foto. Compartir un archivo entre varios materiales parece un ahorro, pero al
// reemplazar la imagen de uno el service borra el archivo anterior del disco
// (returnableMaterial.service.js / consumableMaterial.service.js) y dejaría rotas
// las demás filas que apuntaban ahí.
const copiarImagen = (origen, nombre) => {
  const destino = path.join(UPLOADS, nombre);
  if (!fs.existsSync(destino)) fs.copyFileSync(path.join(ASSETS, origen), destino);
  return `/uploads/${nombre}`;
};

const escribirPdf = (nombre, titulo, lineas) => {
  const destino = path.join(UPLOADS, nombre);
  if (!fs.existsSync(destino)) fs.writeFileSync(destino, crearPdfSimple(titulo, lineas));
  return `/uploads/${nombre}`;
};

const borrarArchivosDemo = () => {
  if (!fs.existsSync(UPLOADS)) return 0;
  const archivos = fs.readdirSync(UPLOADS).filter((f) => f.startsWith(PREFIJO));
  archivos.forEach((f) => fs.unlinkSync(path.join(UPLOADS, f)));
  return archivos.length;
};

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------

const marcas = [
  'Pony Malta', 'Bavaria', 'Postobón', 'Colombina',
  'Jordan', 'Nike', 'Adidas', 'Puma',
];

// 2 administradores, 5 instructores y 5 invitados.
// Los que responden por inventario son Cuentadante; los invitados, Solidario.
const usuarios = [
  { nombre: 'Santiago',  apellido: 'Acevedo Medina',   rol: 'Administrador', tipo: 'Cuentadante' },
  { nombre: 'Laura',     apellido: 'Beltrán Ruiz',     rol: 'Administrador', tipo: 'Cuentadante' },
  { nombre: 'Juan Diego',apellido: 'Gómez Rosales',    rol: 'Instructor',    tipo: 'Cuentadante' },
  { nombre: 'Carolina',  apellido: 'Martínez Peña',    rol: 'Instructor',    tipo: 'Cuentadante' },
  { nombre: 'Andrés',    apellido: 'Quintero Salas',   rol: 'Instructor',    tipo: 'Cuentadante' },
  { nombre: 'Paula',     apellido: 'Rincón Vargas',    rol: 'Instructor',    tipo: 'Cuentadante' },
  { nombre: 'Felipe',    apellido: 'Ortega Cárdenas',  rol: 'Instructor',    tipo: 'Cuentadante' },
  { nombre: 'Valentina', apellido: 'Suárez Molina',    rol: 'Invitado',      tipo: 'Solidario'   },
  { nombre: 'Mateo',     apellido: 'Herrera Duarte',   rol: 'Invitado',      tipo: 'Solidario'   },
  { nombre: 'Daniela',   apellido: 'Cifuentes Rojas',  rol: 'Invitado',      tipo: 'Solidario'   },
  { nombre: 'Sebastián', apellido: 'Nieto Camargo',    rol: 'Invitado',      tipo: 'Solidario'   },
  { nombre: 'Isabella',  apellido: 'Pardo Guzmán',     rol: 'Invitado',      tipo: 'Solidario'   },
];

// Mayoría Disponible y unos pocos en el resto, para que el filtro por estado de
// la barra de la tabla y el reporte tengan algo que mostrar
const ESTADOS = [
  'Disponible', 'Disponible', 'Disponible', 'Disponible', 'Disponible',
  'Disponible', 'Mantenimiento', 'Disponible', 'Traslado', 'Disponible',
  'Disponible', 'No_disponible', 'Disponible', 'Disponible', 'Baja',
];
const estadoDe = (i) => ESTADOS[i % ESTADOS.length];

const UBICACIONES = [
  'Bodega 1 — Estante A1', 'Bodega 1 — Estante B2', 'Bodega 2 — Estante A3',
  'Bodega 2 — Estante C1', 'Almacén general — Rack 4', 'ADSO Zona 3',
];

// 25 consumibles alrededor de la bebida: presentaciones, empaques e insumos.
// `placa` presente ⇒ material serializado ⇒ cantidad null (así lo entienden
// préstamos y retornos), por eso solo la llevan los equipos, no las bebidas.
const consumibles = [
  { nombre: 'Pony Malta 330ml botella',        marca: 'Pony Malta', cantidad: 480, precio: 2200 },
  { nombre: 'Pony Malta 250ml lata',           marca: 'Pony Malta', cantidad: 360, precio: 1900 },
  { nombre: 'Pony Malta 500ml PET',            marca: 'Pony Malta', cantidad: 240, precio: 3100 },
  { nombre: 'Pony Malta six pack 330ml',       marca: 'Pony Malta', cantidad: 90,  precio: 12500 },
  { nombre: 'Pony Malta caja x24 330ml',       marca: 'Pony Malta', cantidad: 40,  precio: 49000 },
  { nombre: 'Pony Malta 1.5L familiar',        marca: 'Pony Malta', cantidad: 75,  precio: 6800 },
  { nombre: 'Malta Leona 330ml',               marca: 'Bavaria',    cantidad: 200, precio: 2400 },
  { nombre: 'Agua Brisa 600ml',                marca: 'Bavaria',    cantidad: 320, precio: 1800 },
  { nombre: 'Pepsi 400ml',                     marca: 'Postobón',   cantidad: 180, precio: 2600 },
  { nombre: 'Colombiana 400ml',                marca: 'Postobón',   cantidad: 210, precio: 2600 },
  { nombre: 'Manzana Postobón 400ml',          marca: 'Postobón',   cantidad: 195, precio: 2600 },
  { nombre: 'Hit Mora 500ml',                  marca: 'Postobón',   cantidad: 140, precio: 3200 },
  { nombre: 'Bon Bon Bum surtido x24',         marca: 'Colombina',  cantidad: 60,  precio: 9800 },
  { nombre: 'Chocmelos bolsa 200g',            marca: 'Colombina',  cantidad: 85,  precio: 5400 },
  { nombre: 'Vaso desechable 7oz paquete x50', marca: 'Colombina',  cantidad: 120, precio: 4300 },
  { nombre: 'Servilleta blanca paquete x100',  marca: 'Colombina',  cantidad: 150, precio: 3600 },
  { nombre: 'Pitillo biodegradable x100',      marca: 'Postobón',   cantidad: 110, precio: 5200 },
  { nombre: 'Hielo en cubo bolsa 2kg',         marca: 'Bavaria',    cantidad: 45,  precio: 4800 },
  { nombre: 'Destapador metálico',             marca: 'Bavaria',    cantidad: 35,  precio: 3900 },
  { nombre: 'Canasta plástica para botellas',  marca: 'Pony Malta', cantidad: 28,  precio: 21000 },
  { nombre: 'Etiqueta adhesiva rollo x500',    marca: 'Colombina',  cantidad: 55,  precio: 7200 },
  { nombre: 'Guante de nitrilo caja x100',     marca: 'Colombina',  cantidad: 65,  precio: 18500 },
  { nombre: 'Nevera expendedora Pony Malta',   marca: 'Pony Malta', placa: '92451001', precio: 2450000 },
  { nombre: 'Dispensador de bebida frío',      marca: 'Postobón',   placa: '92451002', precio: 1780000 },
  { nombre: 'Carro transportador de canastas', marca: 'Bavaria',    placa: '92451003', precio: 890000 },
];

// 25 devolutivos con los tenis. "Muebles y enseres" es la única categoría que
// pide dimensiones; el resto las deja en NULL.
const MODELOS_JORDAN = [
  ['4 Retro', 'Fire Red'], ['1 High OG', 'Chicago'], ['3 Retro', 'White Cement'],
  ['11 Retro', 'Bred'], ['6 Retro', 'Infrared'], ['5 Retro', 'Metallic'],
  ['12 Retro', 'Flu Game'], ['13 Retro', 'He Got Game'], ['1 Mid', 'Banned'],
  ['4 Retro', 'Black Cat'], ['7 Retro', 'Olympic'], ['9 Retro', 'Space Jam'],
  ['2 Retro', 'Chicago'], ['8 Retro', 'Aqua'], ['10 Retro', 'Steel'],
  ['14 Retro', 'Last Shot'], ['1 Low', 'Shadow'], ['31 Retro', 'Banned'],
  ['XXXV', 'Warrior'], ['Zoom 92', 'Racer Blue'], ['Delta 3', 'Sail'],
  ['Max Aura 5', 'Cement'], ['Luka 2', 'Lake Bled'], ['Tatum 1', 'Zoo'],
  ['Spizike', 'Bordeaux'],
];
const CATEGORIAS_ROTACION = ['Herramienta', 'Maquinaria y equipos', 'Muebles y enseres'];

const tareas = [
  ['Inventariar lote de Pony Malta',        'Contar y verificar el lote recibido de Pony Malta 330ml en Bodega 1.', 'en_progreso'],
  ['Revisar fichas técnicas devolutivos',   'Comprobar que cada material devolutivo tenga su ficha técnica cargada.', 'en_progreso'],
  ['Actualizar placas SENA faltantes',      'Asignar placa a los equipos serializados que aún no la tienen.', 'en_progreso'],
  ['Depurar materiales dados de baja',      'Revisar los materiales en estado Baja y documentar el motivo.', 'completada'],
  ['Reubicar canastas a Bodega 2',          'Trasladar las canastas plásticas del estante A1 al C1.', 'completada'],
  ['Verificar stock de vasos y servilletas','Cotejar la cantidad en sistema contra el conteo físico.', 'en_progreso'],
  ['Mantenimiento de nevera expendedora',   'Programar el mantenimiento preventivo de la nevera de Bodega 1.', 'en_progreso'],
  ['Cargar imágenes faltantes',             'Subir la fotografía de los materiales que quedaron sin imagen.', 'completada'],
  ['Auditar préstamos vencidos',            'Listar los préstamos cuya fecha de devolución ya pasó.', 'no_completada'],
  ['Capacitar a instructores nuevos',       'Sesión de uso del módulo de préstamos para los instructores.', 'no_completada'],
  ['Revisar cuentadantes asignados',        'Confirmar que cada material tenga un cuentadante vigente.', 'en_progreso'],
  ['Preparar reporte mensual de inventario','Generar el reporte en Excel y PDF del mes en curso.', 'en_progreso'],
];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const fecha = (texto) => new Date(`${texto}T00:00:00.000Z`);

const enDias = (dias) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
};

// Solo letras: se usa para armar los correos, donde un número suelto quedaría raro
const sinTildes = (t) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');

// Para nombres de archivo hay que conservar los números: el modelo "4 Retro"
// perdería el 4 con `sinTildes` y dos fichas distintas se llamarían igual
const slug = (t) =>
  t.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Los datos reales de la BD no se conocen desde aquí: una placa SENA, un serial
// o un documento inventado para la demostración puede chocar con uno que ya
// exista. Un choque no debe tumbar el poblado entero, solo saltarse ese registro.
async function intentar(descripcion, fn) {
  try {
    await fn();
    return true;
  } catch (e) {
    if (e.code === 'P2002') {
      const campo = Array.isArray(e.meta?.target) ? e.meta.target.join(', ') : e.meta?.target;
      console.warn(`\u26a0 Se omite "${descripcion}": ya existe otro registro con el mismo ${campo}.`);
      return false;
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Limpieza
// ---------------------------------------------------------------------------

async function limpiar() {
  // Los materiales que ya estén en un préstamo NO se pueden borrar: la FK de
  // loan_materials lo impide y, aunque se pudiera, se perdería el histórico del
  // préstamo. Se dejan y se avisa.
  const materiales = await prisma.consumableMaterial.findMany({
    where: { image: { startsWith: `/uploads/${PREFIJO}` } },
    select: { id: true, materialName: true, _count: { select: { loanMaterials: true } } },
  });
  const borrables = materiales.filter((m) => m._count.loanMaterials === 0).map((m) => m.id);
  const enPrestamo = materiales.filter((m) => m._count.loanMaterials > 0);

  const usuariosDemo = await prisma.user.findMany({
    where: { userPhoto: { startsWith: `/uploads/${PREFIJO}` } },
    select: { id: true },
  });
  const idsUsuarios = usuariosDemo.map((u) => u.id);

  await prisma.task.deleteMany({ where: { userId: { in: idsUsuarios } } });
  // returnable_materials cae en cascada desde consumable_materials, y
  // returnable_material_files en cascada desde returnable_materials
  await prisma.consumableMaterial.deleteMany({ where: { id: { in: borrables } } });

  // Un usuario con materiales a su nombre (los que quedaron por estar en un
  // préstamo) tampoco se puede borrar: la FK de consumable_materials lo bloquea
  const usuariosLibres = [];
  for (const id of idsUsuarios) {
    const conMateriales = await prisma.consumableMaterial.count({ where: { userId: id } });
    const conFirmas = await prisma.loanSignature.count({ where: { userId: id } });
    if (conMateriales === 0 && conFirmas === 0) usuariosLibres.push(id);
  }
  await prisma.userGroup.deleteMany({ where: { userId: { in: usuariosLibres } } });
  await prisma.notification.deleteMany({ where: { userId: { in: usuariosLibres } } });
  await prisma.passwordResetCode.deleteMany({ where: { userId: { in: usuariosLibres } } });
  await prisma.userPermission.deleteMany({ where: { userId: { in: usuariosLibres } } });
  await prisma.user.deleteMany({ where: { id: { in: usuariosLibres } } });

  await prisma.brand.deleteMany({
    where: { brandName: { in: marcas }, consumableMaterials: { none: {} } },
  });

  const archivos = borrarArchivosDemo();

  console.log(`✓ Borrados ${borrables.length} materiales, ${usuariosLibres.length} usuarios y ${archivos} archivos.`);
  if (enPrestamo.length) {
    console.warn(`⚠ ${enPrestamo.length} materiales se conservaron por estar en un préstamo:`);
    enPrestamo.forEach((m) => console.warn(`   - #${m.id} ${m.materialName}`));
  }
}

// ---------------------------------------------------------------------------
// Poblado
// ---------------------------------------------------------------------------

async function poblar() {
  if (!fs.existsSync(ASSETS)) {
    throw new Error(`No se encuentra ${ASSETS}. Ahí deben estar ponymalta.jpg y jordan.jpg.`);
  }
  fs.mkdirSync(UPLOADS, { recursive: true });

  // 1. Marcas
  const marcasCreadas = {};
  for (const brandName of marcas) {
    marcasCreadas[brandName] = await prisma.brand.upsert({
      where: { brandName },
      update: {},
      create: { brandName },
    });
  }
  console.log(`✓ ${marcas.length} marcas.`);

  // 2. Usuarios
  const cedula = await prisma.documentType.findUnique({
    where: { documentName: 'Cédula de Ciudadanía' },
  });
  if (!cedula) throw new Error('Falta el catálogo de tipos de documento: corre antes `prisma/seed.js`.');

  const grupos = {};
  for (const nombre of ['Administrador', 'Instructor', 'Invitado']) {
    const g = await prisma.group.findUnique({ where: { groupName: nombre } });
    if (!g) throw new Error(`Falta el grupo "${nombre}": corre antes \`prisma/seed.js\`.`);
    grupos[nombre] = g;
  }

  const hash = await bcrypt.hash(PASSWORD_DEMO, SALT_ROUNDS);
  const usuariosCreados = [];

  for (const [i, u] of usuarios.entries()) {
    const documento = String(1090000001 + i);
    const alias = `${sinTildes(u.nombre)}.${sinTildes(u.apellido.split(' ')[0])}`;
    const foto = copiarImagen('ponymalta.jpg', `${PREFIJO}user_${i + 1}.jpg`);

    const creado = await prisma.user.upsert({
      where: { userDocumentNumber: documento },
      update: {
        userFirstName: u.nombre,
        userLastName: u.apellido,
        userAccountType: u.tipo,
        userPassword: hash,
      },
      create: {
        documentTypeId: cedula.id,
        userFirstName: u.nombre,
        userLastName: u.apellido,
        userDocumentNumber: documento,
        // Los de planta (administradores e instructores) no tienen fecha de fin
        // de vínculo; los invitados sí (migración p44)
        userEndDate: u.rol === 'Invitado' ? enDias(180) : null,
        userEmail: `${alias}${i + 1}@gmail.com`,
        userEmailInstitutional: `${alias}${i + 1}@sena.edu.co`,
        userPhone: `30${String(10000000 + i * 137).slice(0, 8)}`,
        userAddress: `Calle ${20 + i} # ${10 + i}-${30 + i}, Bogotá`,
        userPhoto: foto,
        userPassword: hash,
        userAccountType: u.tipo,
      },
    });

    await prisma.userGroup.upsert({
      where: { userId_groupId: { userId: creado.id, groupId: grupos[u.rol].id } },
      update: {},
      create: { userId: creado.id, groupId: grupos[u.rol].id },
    });

    usuariosCreados.push({ ...creado, rol: u.rol });
  }
  console.log(`✓ ${usuarios.length} usuarios (contraseña: ${PASSWORD_DEMO}).`);

  // Solo los cuentadantes pueden responder por un material
  const cuentadantes = usuariosCreados.filter((u) => u.userAccountType === 'Cuentadante');

  // Un material de demostración se reconoce por su imagen: es la misma marca que
  // usa la limpieza, así que buscar por nombre entre ellos basta para no duplicar
  const buscarMaterialDemo = (materialName) =>
    prisma.consumableMaterial.findFirst({
      where: { materialName, image: { startsWith: `/uploads/${PREFIJO}` } },
    });

  // 3. Materiales consumibles
  let nuevosConsumibles = 0;
  for (const [i, c] of consumibles.entries()) {
    if (await buscarMaterialDemo(c.nombre)) continue;

    const serializado = Boolean(c.placa);
    const cantidad = serializado ? null : c.cantidad;
    const total = c.precio * (cantidad ?? 1);

    const creado = await intentar(c.nombre, () => prisma.consumableMaterial.create({
      data: {
        userId: cuentadantes[i % cuentadantes.length].id,
        brandId: marcasCreadas[c.marca].id,
        senaPlate: c.placa ?? null,
        materialName: c.nombre,
        image: copiarImagen('ponymalta.jpg', `${PREFIJO}consumible_${i + 1}.jpg`),
        quantity: cantidad,
        unitPrice: c.precio,
        totalPrice: total,
        status: estadoDe(i),
        description: `${c.nombre} — insumo de la bodega de bienestar del centro de formación.`,
        purchaseDate: fecha('2026-04-10'),
        location: UBICACIONES[i % UBICACIONES.length],
      },
    }));
    if (creado) nuevosConsumibles += 1;
  }
  console.log(`✓ ${nuevosConsumibles} materiales consumibles nuevos (${consumibles.length} en total).`);

  // 4. Materiales devolutivos
  const categorias = {};
  for (const nombre of CATEGORIAS_ROTACION) {
    const c = await prisma.category.findUnique({ where: { categoryName: nombre } });
    if (!c) throw new Error(`Falta la categoría "${nombre}": corre antes \`prisma/seed.js\`.`);
    categorias[nombre] = c;
  }

  let nuevosDevolutivos = 0;
  for (const [i, [modelo, color]] of MODELOS_JORDAN.entries()) {
    const nombre = `Jordan ${modelo} ${color}`;
    if (await buscarMaterialDemo(nombre)) continue;

    const categoria = CATEGORIAS_ROTACION[i % CATEGORIAS_ROTACION.length];
    // Los tres primeros de cada vuelta van serializados (placa + cantidad null)
    const serializado = i % 5 !== 4;
    const precio = 780000 + (i % 7) * 45000;
    const cantidad = serializado ? null : 4 + (i % 3);

    // Entre 1 y 3 fichas para poder ver el botón directo y el desplegable
    const cuantasFichas = (i % 3) + 1;
    const fichas = Array.from({ length: cuantasFichas }, (_, f) =>
      escribirPdf(
        `${PREFIJO}ficha_${i + 1}_${f + 1}.pdf`,
        `Ficha tecnica ${f + 1} de ${cuantasFichas} - ${nombre}`,
        [
          `Marca: Jordan   Modelo: ${modelo}   Colorway: ${color}`,
          `Serial: DEMO-R-${String(i + 1).padStart(3, '0')}`,
          `Categoria: ${categoria}`,
          '',
          'Documento de relleno generado por prisma/seed-demo.js',
        ],
      ),
    );

    const creadoDev = await intentar(nombre, () => prisma.consumableMaterial.create({
      data: {
        userId: cuentadantes[i % cuentadantes.length].id,
        brandId: marcasCreadas[i % 4 === 0 ? 'Nike' : i % 4 === 1 ? 'Jordan' : i % 4 === 2 ? 'Adidas' : 'Puma'].id,
        senaPlate: serializado ? `92452${String(i + 1).padStart(3, '0')}` : null,
        materialName: nombre,
        image: copiarImagen('jordan.jpg', `${PREFIJO}devolutivo_${i + 1}.jpg`),
        quantity: cantidad,
        unitPrice: precio,
        totalPrice: precio * (cantidad ?? 1),
        status: estadoDe(i + 3),
        description: `${nombre} — elemento devolutivo del taller de calzado y marroquinería.`,
        purchaseDate: fecha('2026-02-20'),
        location: UBICACIONES[(i + 2) % UBICACIONES.length],
        returnable: {
          create: {
            categoryId: categorias[categoria].id,
            model: modelo,
            serial: `DEMO-R-${String(i + 1).padStart(3, '0')}`,
            // Solo "Muebles y enseres" pide dimensiones; el resto queda en NULL
            dimensions: categoria === 'Muebles y enseres' ? `${30 + i}cm x ${18 + i}cm x ${12 + i}cm` : null,
            technicalSheets: {
              create: fichas.map((fileUrl, orden) => ({
                fileUrl,
                fileName: `ficha-tecnica-${slug(nombre)}-${orden + 1}.pdf`,
                mimeType: 'application/pdf',
                sortOrder: orden,
              })),
            },
          },
        },
      },
    }));
    if (creadoDev) nuevosDevolutivos += 1;
  }
  console.log(`✓ ${nuevosDevolutivos} materiales devolutivos nuevos (${MODELOS_JORDAN.length} en total).`);

  // 5. Tareas
  let nuevasTareas = 0;
  for (const [i, [taskName, description, status]] of tareas.entries()) {
    const responsable = usuariosCreados[i % usuariosCreados.length];
    const yaExiste = await prisma.task.findFirst({ where: { taskName, userId: responsable.id } });
    if (yaExiste) continue;

    // Las que siguen en progreso tienen que vencer en el futuro: al leerlas, el
    // service pasa a "no_completada" toda tarea en progreso con fecha anterior a
    // hoy, y se verían como fallidas nada más abrir el listado
    const endDate = status === 'en_progreso' ? enDias(7 + i * 3) : enDias(-(5 + i));

    await prisma.task.create({
      data: { userId: responsable.id, taskName, description, endDate, status },
    });
    nuevasTareas += 1;
  }
  console.log(`✓ ${nuevasTareas} tareas nuevas (${tareas.length} en total).`);
}

// ---------------------------------------------------------------------------

async function main() {
  const limpiando = process.argv.includes('--limpiar');
  if (limpiando) {
    console.log('Borrando datos de demostración...');
    await limpiar();
  } else {
    console.log('Creando datos de demostración...');
    await poblar();
  }
}

main()
  .catch((e) => {
    console.error('✗ Error:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
