-- p53.1 — Corrección del traspaso de la clasificación
--
-- Qué salió mal. La migración 20261018100000 movió la categoría de CADA
-- devolutivo a `material_type_id`, sin comprobar si esa categoría era uno de los
-- 3 tipos del sistema:
--
--   UPDATE "consumable_materials" cm
--      SET "material_type_id" = rm."category_id" ...
--
-- Partía de que las únicas categorías existentes eran las 3 sembradas, y eso
-- dejó de ser cierto en p50, cuando las categorías ganaron su propio módulo con
-- creación y edición. Un material classificado con una categoría propia —«gucci
-- 2», en la base de Santiago— quedó con esa categoría como TIPO de material. Y
-- como no está marcada `is_material_type`, no aparece en el select de tipo: el
-- formulario la repone con `ensureOption` solo para no mostrar el campo vacío.
--
-- Lo correcto: una categoría creada por el usuario es una CATEGORÍA. Se devuelve
-- a su campo y el tipo queda vacío, que es la verdad —nadie lo ha elegido
-- todavía— y es lo que el formulario pedirá al editar el material.
--
-- Las dos sentencias son idempotentes: volver a aplicarlas no cambia nada.

-- 1. Lo que no era un tipo vuelve a ser la categoría del material.
--    `category_id IS NULL` protege el trabajo ya hecho: si alguien editó el
--    material y le puso una categoría a mano, no se le pisa.
UPDATE "consumable_materials" cm
   SET "category_id"      = cm."material_type_id",
       "material_type_id" = NULL
  FROM "categories" c
 WHERE c."id" = cm."material_type_id"
   AND c."is_material_type" = FALSE
   AND cm."category_id" IS NULL;

-- 2. Y si el material ya tenía categoría puesta a mano, el tipo equivocado se
--    limpia igual: en `material_type_id` solo pueden quedar filas marcadas como
--    tipo de material.
UPDATE "consumable_materials" cm
   SET "material_type_id" = NULL
  FROM "categories" c
 WHERE c."id" = cm."material_type_id"
   AND c."is_material_type" = FALSE;
