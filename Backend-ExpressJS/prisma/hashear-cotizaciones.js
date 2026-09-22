import 'dotenv/config';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { hashDeArchivo } from '../src/shared/fileHash.js';

// (p50) Calcula la huella de las cotizaciones cargadas ANTES de que existiera la
// columna `file_hash`.
//
// Se ejecuta una sola vez, después de aplicar la migración:
//
//     npm run hashear-cotizaciones
//
// Hasta entonces esas cotizaciones no participan en la detección de duplicados:
// no tienen huella con la que comparar. No es un fallo, es lo correcto —
// inventarles una sería peor.
//
// Solo escribe la columna `file_hash`, y solo donde está vacía.

const prisma = new PrismaClient();

async function main() {
  const pendientes = await prisma.quotation.findMany({
    where: { fileHash: null },
    select: { id: true, fileName: true, fileUrl: true },
  });

  if (pendientes.length === 0) {
    console.log('✓ No hay cotizaciones sin huella. Nada que hacer.');
    return;
  }

  console.log(`Calculando la huella de ${pendientes.length} cotización(es)...\n`);

  let hechas = 0;
  const perdidas = [];

  for (const c of pendientes) {
    // fileUrl es "/uploads/<archivo>"; los archivos viven junto al backend.
    const ruta = path.resolve('.' + c.fileUrl);

    if (!existsSync(ruta)) {
      perdidas.push(c);
      continue;
    }

    const fileHash = await hashDeArchivo(ruta);
    await prisma.quotation.update({ where: { id: c.id }, data: { fileHash } });
    hechas += 1;
  }

  console.log(`✓ ${hechas} cotización(es) con huella calculada.`);

  if (perdidas.length) {
    console.log(`\n✗ ${perdidas.length} sin archivo en disco:`);
    for (const c of perdidas) console.log(`    ${c.id}: ${c.fileName}  (${c.fileUrl})`);
    console.log('\nEstas se quedan sin huella. Revisa si el archivo se movió o se borró:');
    console.log('una cotización cuyo PDF no existe no respalda ningún precio.');
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error('No se pudo completar:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
