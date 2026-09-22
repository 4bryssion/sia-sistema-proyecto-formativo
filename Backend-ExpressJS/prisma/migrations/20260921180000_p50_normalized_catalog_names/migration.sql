-- p50 — Nombres de catálogo comparables
--
-- EL PROBLEMA
--
-- Los cuatro catálogos ya tenían UNIQUE en el nombre, pero la unicidad de
-- PostgreSQL compara el texto carácter a carácter. Estas cinco marcas convivían:
--
--     Gucci · GuccI · guCCi · Gúcci · 'Gucci ' (con espacio al final)
--
-- Cinco registros para una sola cosa, con los materiales repartidos entre ellos.
-- El desorden no se ve en el listado, pero parte en cinco cualquier reporte por
-- marca.
--
-- LA SOLUCIÓN
--
-- Una columna con el nombre normalizado —sin espacios sobrantes, en minúsculas y
-- sin tildes— y un UNIQUE sobre ella. El nombre original se sigue guardando tal
-- como lo escribió la persona: esta columna solo sirve para comparar.
--
-- Va como columna y no como índice sobre una expresión (lower(...)) por un
-- motivo práctico: Prisma no entiende los índices por expresión, no los vería en
-- el esquema y pediría una migración para borrarlos en cada `migrate dev`. Una
-- columna con @unique la entiende entera.
--
-- LA EÑE NO SE TOCA. En español es una letra distinta de la n: 'Niño' y 'Nino'
-- son dos palabras. Por eso `translate` solo mapea vocales acentuadas y deja la
-- ñ en paz. La misma regla, en JavaScript, vive en src/shared/normalizeName.js.
--
-- SI ESTA MIGRACIÓN FALLA: es porque ya existen registros que solo se
-- diferencian por mayúsculas o tildes. El error dice cuáles. Hay que unificarlos
-- a mano —reasignando los materiales al que se quede— antes de volver a aplicarla.
-- No se hace automáticamente a propósito: decidir cuál sobrevive y a dónde van
-- sus materiales no es algo que deba resolver una migración por su cuenta.

-- ---------------------------------------------------------------- marcas

-- 1. Aviso temprano y legible si ya hay duplicados.
DO $$
DECLARE repetidos TEXT;
BEGIN
  SELECT string_agg(DISTINCT n, ', ') INTO repetidos
  FROM (
    SELECT lower(translate(regexp_replace(btrim("brand_name"), '[[:space:]]+', ' ', 'g'),
       'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
       'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu')) AS n
    FROM "brands"
    GROUP BY 1
    HAVING count(*) > 1
  ) t;

  IF repetidos IS NOT NULL THEN
    RAISE EXCEPTION
      'Hay % que solo se diferencian por mayúsculas, tildes o espacios: %. Unifícalas antes de aplicar esta migración.',
      'marcas', repetidos;
  END IF;
END $$;

-- 2. La columna, poblada con lo que ya hay.
ALTER TABLE "brands" ADD COLUMN "brand_name_normalized" VARCHAR(100);

UPDATE "brands" SET "brand_name_normalized" = lower(translate(regexp_replace(btrim("brand_name"), '[[:space:]]+', ' ', 'g'),
       'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
       'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu'));

ALTER TABLE "brands" ALTER COLUMN "brand_name_normalized" SET NOT NULL;

-- 3. La restricción. El nombre del índice es el que Prisma genera para un
--    @unique sobre este campo: si no coincidiera, pediría recrearlo.
CREATE UNIQUE INDEX "brands_brand_name_normalized_key" ON "brands"("brand_name_normalized");

-- ---------------------------------------------------------------- inventarios

-- 1. Aviso temprano y legible si ya hay duplicados.
DO $$
DECLARE repetidos TEXT;
BEGIN
  SELECT string_agg(DISTINCT n, ', ') INTO repetidos
  FROM (
    SELECT lower(translate(regexp_replace(btrim("inventory_name"), '[[:space:]]+', ' ', 'g'),
       'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
       'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu')) AS n
    FROM "inventories"
    GROUP BY 1
    HAVING count(*) > 1
  ) t;

  IF repetidos IS NOT NULL THEN
    RAISE EXCEPTION
      'Hay % que solo se diferencian por mayúsculas, tildes o espacios: %. Unifícalas antes de aplicar esta migración.',
      'inventarios', repetidos;
  END IF;
END $$;

-- 2. La columna, poblada con lo que ya hay.
ALTER TABLE "inventories" ADD COLUMN "inventory_name_normalized" VARCHAR(100);

UPDATE "inventories" SET "inventory_name_normalized" = lower(translate(regexp_replace(btrim("inventory_name"), '[[:space:]]+', ' ', 'g'),
       'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
       'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu'));

ALTER TABLE "inventories" ALTER COLUMN "inventory_name_normalized" SET NOT NULL;

-- 3. La restricción. El nombre del índice es el que Prisma genera para un
--    @unique sobre este campo: si no coincidiera, pediría recrearlo.
CREATE UNIQUE INDEX "inventories_inventory_name_normalized_key" ON "inventories"("inventory_name_normalized");

-- ---------------------------------------------------------------- categorías

-- 1. Aviso temprano y legible si ya hay duplicados.
DO $$
DECLARE repetidos TEXT;
BEGIN
  SELECT string_agg(DISTINCT n, ', ') INTO repetidos
  FROM (
    SELECT lower(translate(regexp_replace(btrim("category_name"), '[[:space:]]+', ' ', 'g'),
       'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
       'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu')) AS n
    FROM "categories"
    GROUP BY 1
    HAVING count(*) > 1
  ) t;

  IF repetidos IS NOT NULL THEN
    RAISE EXCEPTION
      'Hay % que solo se diferencian por mayúsculas, tildes o espacios: %. Unifícalas antes de aplicar esta migración.',
      'categorías', repetidos;
  END IF;
END $$;

-- 2. La columna, poblada con lo que ya hay.
ALTER TABLE "categories" ADD COLUMN "category_name_normalized" VARCHAR(100);

UPDATE "categories" SET "category_name_normalized" = lower(translate(regexp_replace(btrim("category_name"), '[[:space:]]+', ' ', 'g'),
       'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
       'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu'));

ALTER TABLE "categories" ALTER COLUMN "category_name_normalized" SET NOT NULL;

-- 3. La restricción. El nombre del índice es el que Prisma genera para un
--    @unique sobre este campo: si no coincidiera, pediría recrearlo.
CREATE UNIQUE INDEX "categories_category_name_normalized_key" ON "categories"("category_name_normalized");

-- ---------------------------------------------------------------- grupos

-- 1. Aviso temprano y legible si ya hay duplicados.
DO $$
DECLARE repetidos TEXT;
BEGIN
  SELECT string_agg(DISTINCT n, ', ') INTO repetidos
  FROM (
    SELECT lower(translate(regexp_replace(btrim("group_name"), '[[:space:]]+', ' ', 'g'),
       'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
       'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu')) AS n
    FROM "groups"
    GROUP BY 1
    HAVING count(*) > 1
  ) t;

  IF repetidos IS NOT NULL THEN
    RAISE EXCEPTION
      'Hay % que solo se diferencian por mayúsculas, tildes o espacios: %. Unifícalas antes de aplicar esta migración.',
      'grupos', repetidos;
  END IF;
END $$;

-- 2. La columna, poblada con lo que ya hay.
ALTER TABLE "groups" ADD COLUMN "group_name_normalized" VARCHAR(100);

UPDATE "groups" SET "group_name_normalized" = lower(translate(regexp_replace(btrim("group_name"), '[[:space:]]+', ' ', 'g'),
       'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛáàäâãéèëêíìïîóòöôõúùüû',
       'AAAAAEEEEIIIIOOOOOUUUUaaaaaeeeeiiiiooooouuuu'));

ALTER TABLE "groups" ALTER COLUMN "group_name_normalized" SET NOT NULL;

-- 3. La restricción. El nombre del índice es el que Prisma genera para un
--    @unique sobre este campo: si no coincidiera, pediría recrearlo.
CREATE UNIQUE INDEX "groups_group_name_normalized_key" ON "groups"("group_name_normalized");
