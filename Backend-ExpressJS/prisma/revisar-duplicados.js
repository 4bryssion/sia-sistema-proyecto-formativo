import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';

// (p50) ¿Hay nombres que solo se diferencian por mayúsculas, tildes o espacios?
//
// Se ejecuta ANTES de aplicar la migración `p50_normalized_catalog_names`: esa
// migración añade un UNIQUE sobre el nombre normalizado, y si ya existen
// duplicados no puede aplicarse hasta que se unifiquen.
//
// Va en JavaScript y no en un .sql a propósito: así no hace falta tener `psql`
// en el PATH. Prisma ya sabe conectarse con el DATABASE_URL del .env.
//
//   npm run revisar-duplicados
//
// Solo LEE. No modifica nada.

const prisma = new PrismaClient();

// La misma regla que src/shared/normalizeName.js, escrita en SQL: minúsculas,
// espacios colapsados y vocales sin tilde. La eñe NO se mapea: en español es una
// letra distinta de la ene.
const CATALOGOS = [
  {
    etiqueta: 'Marcas',
    sql: Prisma.sql`
      SELECT clave, count(*)::int AS cuantos,
             string_agg(id || ': ' || nombre, '  |  ' ORDER BY id) AS registros
      FROM (
        SELECT id, "brand_name" AS nombre, lower(translate(regexp_replace(btrim("brand_name"), '[[:space:]]+', ' ', 'g'),
                 'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
                 'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu')) AS clave
        FROM "brands"
      ) t
      GROUP BY clave
      HAVING count(*) > 1
      ORDER BY clave`,
  },
  {
    etiqueta: 'Inventarios',
    sql: Prisma.sql`
      SELECT clave, count(*)::int AS cuantos,
             string_agg(id || ': ' || nombre, '  |  ' ORDER BY id) AS registros
      FROM (
        SELECT id, "inventory_name" AS nombre, lower(translate(regexp_replace(btrim("inventory_name"), '[[:space:]]+', ' ', 'g'),
                 'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
                 'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu')) AS clave
        FROM "inventories"
      ) t
      GROUP BY clave
      HAVING count(*) > 1
      ORDER BY clave`,
  },
  {
    etiqueta: 'Categorías',
    sql: Prisma.sql`
      SELECT clave, count(*)::int AS cuantos,
             string_agg(id || ': ' || nombre, '  |  ' ORDER BY id) AS registros
      FROM (
        SELECT id, "category_name" AS nombre, lower(translate(regexp_replace(btrim("category_name"), '[[:space:]]+', ' ', 'g'),
                 'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
                 'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu')) AS clave
        FROM "categories"
      ) t
      GROUP BY clave
      HAVING count(*) > 1
      ORDER BY clave`,
  },
  {
    etiqueta: 'Grupos',
    sql: Prisma.sql`
      SELECT clave, count(*)::int AS cuantos,
             string_agg(id || ': ' || nombre, '  |  ' ORDER BY id) AS registros
      FROM (
        SELECT id, "group_name" AS nombre, lower(translate(regexp_replace(btrim("group_name"), '[[:space:]]+', ' ', 'g'),
                 'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
                 'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu')) AS clave
        FROM "groups"
      ) t
      GROUP BY clave
      HAVING count(*) > 1
      ORDER BY clave`,
  }
];

async function main() {
  let total = 0;

  for (const { etiqueta, sql } of CATALOGOS) {
    const filas = await prisma.$queryRaw(sql);

    if (filas.length === 0) {
      console.log(`✓ ${etiqueta}: sin duplicados.`);
      continue;
    }

    total += filas.length;
    console.log(`\n✗ ${etiqueta}: ${filas.length} caso(s) que chocarían:`);
    for (const f of filas) {
      console.log(`    «${f.clave}» → ${f.cuantos} registros:  ${f.registros}`);
    }
  }

  console.log('');
  if (total === 0) {
    console.log('Todo limpio. Ya puedes aplicar la migración con: npx prisma migrate dev');
  } else {
    console.log(`Hay ${total} grupo(s) de nombres repetidos.`);
    console.log('Unifícalos antes de migrar: deja uno, reasigna lo que dependa de los otros');
    console.log('y elimínalos. La migración no se aplicará mientras existan.');
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error('No se pudo consultar la base de datos:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
