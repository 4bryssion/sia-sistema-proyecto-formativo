-- p48 — Migración consolidada
--
-- Cubre, en un solo paso: vigencia de usuarios, tratamiento de datos, cambio de
-- contraseña obligatorio, módulo de inventarios, cuentadantes múltiples, 3
-- imágenes por material, fichas técnicas compartidas, fecha de ingreso, campos
-- opcionales y préstamos con receptor externo.
--
-- ORDEN IMPORTANTE: cada columna que pasa a NOT NULL se rellena ANTES de
-- aplicar la restricción. Si se invierte el orden, Postgres aborta la migración
-- en cuanto encuentra la primera fila existente.
--
-- ⚠ REVISAR ANTES DE EJECUTAR: el valor de relleno de user_end_date (paso 1.2).

-- =====================================================================
-- 1. USUARIOS — vigencia, foto opcional, datos personales y contraseña
-- =====================================================================

-- 1.1 Fecha de inicio: campo NUEVO. Las filas existentes toman la fecha en que
--     se creó el usuario, que es lo más cercano a "desde cuándo tiene vínculo".
ALTER TABLE "users" ADD COLUMN "user_start_date" DATE;
UPDATE "users" SET "user_start_date" = "created_at"::date WHERE "user_start_date" IS NULL;
ALTER TABLE "users" ALTER COLUMN "user_start_date" SET NOT NULL;

-- 1.2 Fecha de finalización: vuelve a ser obligatoria (revierte p44).
--     Los usuarios que hoy la tienen vacía son los que se crearon marcados como
--     "instructor de planta". No existe un valor correcto para ellos, así que se
--     usa la misma fecha lejana que el seed le da al SuperAdmin.
--     >>> Si prefieres otra fecha, cámbiala aquí antes de ejecutar. <<<
UPDATE "users" SET "user_end_date" = DATE '2030-12-31' WHERE "user_end_date" IS NULL;
ALTER TABLE "users" ALTER COLUMN "user_end_date" SET NOT NULL;

-- 1.3 La foto deja de ser obligatoria (sin foto se muestra un icono de usuario)
ALTER TABLE "users" ALTER COLUMN "user_photo" DROP NOT NULL;

-- 1.4 Tratamiento de datos personales (Ley 1581 de 2012). Se guarda la FECHA de
--     aceptación, no un booleano: un "sí" sin fecha no evidencia consentimiento.
--     Los usuarios que ya existen no la tienen: quedan en NULL a propósito.
ALTER TABLE "users" ADD COLUMN "data_policy_accepted_at" TIMESTAMP(3);

-- 1.5 Cambio de contraseña obligatorio en el primer inicio de sesión.
--     Los usuarios YA existentes no deben verse forzados (ya usan su contraseña),
--     así que se crea con default true y de inmediato se pone false a los actuales.
ALTER TABLE "users" ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT true;
UPDATE "users" SET "must_change_password" = false;

-- =====================================================================
-- 2. INVENTARIOS — módulo nuevo, gemelo de marcas
-- =====================================================================

CREATE TABLE "inventories" (
    "id"             SERIAL       NOT NULL,
    "inventory_name" VARCHAR(100) NOT NULL,
    "is_active"      BOOLEAN      NOT NULL DEFAULT true,
    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventories_inventory_name_key" ON "inventories"("inventory_name");

ALTER TABLE "consumable_materials" ADD COLUMN "inventory_id" INTEGER;
ALTER TABLE "consumable_materials"
    ADD CONSTRAINT "consumable_materials_inventory_id_fkey"
    FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- 3. MATERIALES — cuentadantes múltiples
-- =====================================================================

CREATE TABLE "material_accountables" (
    "material_id" INTEGER NOT NULL,
    "user_id"     INTEGER NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "material_accountables_pkey" PRIMARY KEY ("material_id","user_id")
);
CREATE INDEX "material_accountables_user_id_idx" ON "material_accountables"("user_id");

ALTER TABLE "material_accountables"
    ADD CONSTRAINT "material_accountables_material_id_fkey"
    FOREIGN KEY ("material_id") REFERENCES "consumable_materials"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "material_accountables"
    ADD CONSTRAINT "material_accountables_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Traslado del cuentadante actual: cada material entra con el que ya tenía, así
-- ningún material queda huérfano de responsable.
INSERT INTO "material_accountables" ("material_id","user_id")
SELECT "id", "user_id" FROM "consumable_materials";

-- Solo ahora se puede soltar la columna: los datos ya están a salvo arriba.
ALTER TABLE "consumable_materials" DROP CONSTRAINT "consumable_materials_user_id_fkey";
ALTER TABLE "consumable_materials" DROP COLUMN "user_id";

-- =====================================================================
-- 4. MATERIALES — hasta 3 imágenes
-- =====================================================================

CREATE TABLE "consumable_material_images" (
    "id"          SERIAL       NOT NULL,
    "material_id" INTEGER      NOT NULL,
    "image_url"   VARCHAR(255) NOT NULL,
    "file_name"   VARCHAR(255) NOT NULL,
    "mime_type"   VARCHAR(100) NOT NULL,
    "sort_order"  INTEGER      NOT NULL DEFAULT 0,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consumable_material_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "consumable_material_images_material_id_idx" ON "consumable_material_images"("material_id");

ALTER TABLE "consumable_material_images"
    ADD CONSTRAINT "consumable_material_images_material_id_fkey"
    FOREIGN KEY ("material_id") REFERENCES "consumable_materials"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Traslado de la imagen única. El nombre de archivo sale de la propia ruta
-- (/uploads/<archivo>) y el mime se deduce de la extensión: son los únicos dos
-- formatos que multer aceptaba, así que no hay tercer caso posible.
INSERT INTO "consumable_material_images" ("material_id","image_url","file_name","mime_type","sort_order")
SELECT
    "id",
    "image",
    regexp_replace("image", '^.*/', ''),
    CASE WHEN lower("image") LIKE '%.png' THEN 'image/png' ELSE 'image/jpeg' END,
    0
FROM "consumable_materials"
WHERE "image" IS NOT NULL AND "image" <> '';

ALTER TABLE "consumable_materials" DROP COLUMN "image";

-- =====================================================================
-- 5. MATERIALES — fichas técnicas compartidas por los dos tipos
-- =====================================================================

-- Se renombra en lugar de crear y copiar: conserva los ids, y los material_id
-- ya son válidos como consumable_materials.id porque returnable_materials
-- comparte clave primaria con su tabla padre.
ALTER TABLE "returnable_material_files" RENAME TO "material_files";
ALTER TABLE "material_files" RENAME CONSTRAINT "returnable_material_files_pkey" TO "material_files_pkey";
ALTER INDEX "returnable_material_files_material_id_idx" RENAME TO "material_files_material_id_idx";

ALTER TABLE "material_files" DROP CONSTRAINT "returnable_material_files_material_id_fkey";
ALTER TABLE "material_files"
    ADD CONSTRAINT "material_files_material_id_fkey"
    FOREIGN KEY ("material_id") REFERENCES "consumable_materials"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================================
-- 6. MATERIALES — fecha de ingreso y campos opcionales
-- =====================================================================

-- Fecha de ingreso al almacén. Para lo ya registrado se asume que ingresó el día
-- de la compra: es el único dato existente que puede sostener la afirmación.
ALTER TABLE "consumable_materials" ADD COLUMN "entry_date" DATE;
UPDATE "consumable_materials" SET "entry_date" = "purchase_date" WHERE "entry_date" IS NULL;
ALTER TABLE "consumable_materials" ALTER COLUMN "entry_date" SET NOT NULL;

-- Marca opcional en material de consumo
ALTER TABLE "consumable_materials" ALTER COLUMN "brand_id" DROP NOT NULL;

-- Modelo y serial opcionales en material devolutivo. El índice único de serial
-- se conserva: en Postgres los NULL no colisionan entre sí.
ALTER TABLE "returnable_materials" ALTER COLUMN "model"  DROP NOT NULL;
ALTER TABLE "returnable_materials" ALTER COLUMN "serial" DROP NOT NULL;

-- =====================================================================
-- 7. PRÉSTAMOS — tipo, grupo opcional y receptor externo
-- =====================================================================

CREATE TYPE "LoanType" AS ENUM ('Interno', 'Externo');

-- Los préstamos existentes se registraron todos con receptor del sistema, así
-- que entran como Interno; después la columna queda obligatoria.
ALTER TABLE "loans" ADD COLUMN "loan_type" "LoanType";
UPDATE "loans" SET "loan_type" = 'Interno' WHERE "loan_type" IS NULL;
ALTER TABLE "loans" ALTER COLUMN "loan_type" SET NOT NULL;

ALTER TABLE "loans" ALTER COLUMN "apprentice_group" DROP NOT NULL;

-- Receptor no registrado: la firma no apunta a ningún usuario y el enlace viaja
-- al correo externo. El prestador siempre es un usuario del sistema, pero eso
-- depende de `party` y por tanto se hace cumplir en el servicio, no con un CHECK.
ALTER TABLE "loan_signatures" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "loan_signatures" ADD COLUMN "external_email" VARCHAR(150);
