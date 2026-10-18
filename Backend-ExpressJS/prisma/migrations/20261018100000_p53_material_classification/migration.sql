-- p53 — Clasificación del material: tipo de material + categoría, en los DOS tipos
--
-- Qué cambia y por qué, pedido por el instructor en la revisión previa:
--
-- 1. Hasta ahora la categoría servía para dos cosas distintas a la vez. Las 3
--    filas sembradas (Herramienta, Maquinaria y equipos, Muebles y enseres) son
--    el TIPO de material —la clasificación gruesa del inventario del SENA—,
--    mientras que las que crea el usuario («Mesas», «Taladros») son la categoría
--    propiamente dicha. Mezcladas en un solo select, elegir «Mesas» impedía
--    decir que una mesa es un mueble.
--    Ahora son dos campos: `material_type_id` apunta a una de las 3 marcadas, y
--    `category_id` a una de las creadas por el usuario.
--
-- 2. La marca de «esto es un tipo de material» vive en la FILA, igual que
--    `requires_dimensions` y por el mismo motivo: comparar nombres se rompe en
--    silencio en cuanto alguien renombra la fila.
--
-- 3. Los dos campos pasan a la tabla PADRE (`consumable_materials`), no a la
--    hija: el material de consumo también se clasifica, y la categoría estaba
--    únicamente en el devolutivo. Es el mismo movimiento que hicieron en p48 la
--    marca, el inventario, las imágenes y las fichas técnicas.
--
-- 4. `model` y `serial` también se mudan a la tabla padre. Eran del devolutivo y
--    el instructor pide los dos en consumo; duplicarlos dejaría dos fuentes de
--    verdad para un devolutivo, que ES una fila de las dos tablas.
--
-- Los dos campos quedan NULL en la base a propósito. El formulario y el
-- validador los exigen desde ahora, pero las filas que ya existen no tienen
-- categoría propia que ponerles —solo existían las 3 por defecto—, e inventarles
-- una de relleno ensuciaría el módulo de categorías. Cada material antiguo
-- recibe su categoría al editarlo.

-- ---------------------------------------------------------------------------
-- 1. La categoría declara si es un tipo de material
-- ---------------------------------------------------------------------------
ALTER TABLE "categories"
  ADD COLUMN "is_material_type" BOOLEAN NOT NULL DEFAULT false;

-- Las 3 sembradas. Solo se baja a minúsculas, como en p50: el nombre no lleva
-- tildes y `unaccent` es una extensión que puede no estar instalada.
UPDATE "categories"
   SET "is_material_type" = true
 WHERE lower("category_name") IN ('herramienta', 'maquinaria y equipos', 'muebles y enseres');

-- ---------------------------------------------------------------------------
-- 2. Las cuatro columnas nuevas en la tabla padre
-- ---------------------------------------------------------------------------
ALTER TABLE "consumable_materials"
  ADD COLUMN "category_id"      INTEGER,
  ADD COLUMN "material_type_id" INTEGER,
  ADD COLUMN "model"            VARCHAR(100),
  ADD COLUMN "serial"           VARCHAR(20);

-- RESTRICT en las dos: borrar una categoría con material clasificado se llevaría
-- la clasificación de ese material. El módulo de categorías desactiva, no borra.
ALTER TABLE "consumable_materials"
  ADD CONSTRAINT "consumable_materials_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "consumable_materials"
  ADD CONSTRAINT "consumable_materials_material_type_id_fkey"
  FOREIGN KEY ("material_type_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 3. Traspaso de los datos que ya existen
-- ---------------------------------------------------------------------------
-- La categoría que hoy tiene un devolutivo es, en realidad, su tipo de material:
-- las únicas que existían eran las 3 sembradas. Se mueve a `material_type_id` y
-- `category_id` queda vacía hasta que alguien edite el material.
UPDATE "consumable_materials" cm
   SET "material_type_id" = rm."category_id",
       "model"            = rm."model",
       "serial"           = rm."serial"
  FROM "returnable_materials" rm
 WHERE rm."id" = cm."id";

-- La unicidad del serial viaja con la columna. En Postgres varios NULL no
-- colisionan, así que solo aplica a los materiales que sí lo tienen.
CREATE UNIQUE INDEX "consumable_materials_serial_key" ON "consumable_materials"("serial");

-- Buscar por clasificación es la consulta natural del listado de inventario.
CREATE INDEX "consumable_materials_material_type_id_idx" ON "consumable_materials"("material_type_id");
CREATE INDEX "consumable_materials_category_id_idx" ON "consumable_materials"("category_id");

-- ---------------------------------------------------------------------------
-- 4. Fuera de la tabla hija: ya están en el padre
-- ---------------------------------------------------------------------------
DROP INDEX "returnable_materials_serial_key";

ALTER TABLE "returnable_materials"
  DROP CONSTRAINT "returnable_materials_category_id_fkey";

ALTER TABLE "returnable_materials"
  DROP COLUMN "category_id",
  DROP COLUMN "model",
  DROP COLUMN "serial";
