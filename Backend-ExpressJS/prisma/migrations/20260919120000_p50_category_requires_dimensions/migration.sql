-- p50 — La categoría declara si pide dimensiones
--
-- Por qué: hasta ahora "solo Muebles y enseres pide dimensiones" se decidía
-- comparando el NOMBRE de la categoría contra el texto literal "muebles y
-- enseres" (frontend, utils/categoryRules.js). Mientras las categorías eran
-- intocables eso funcionaba; al abrir el módulo de categorías a creación,
-- edición y desactivación, renombrar esa fila apagaría la regla en silencio y
-- los materiales se guardarían sin la medida, sin que nada avisara.
--
-- Con la marca en la fila, la regla deja de depender del nombre: se puede
-- renombrar "Muebles y enseres" sin romper nada, y una categoría nueva puede
-- pedir dimensiones si se marca al crearla.

ALTER TABLE "categories"
  ADD COLUMN "requires_dimensions" BOOLEAN NOT NULL DEFAULT false;

-- Se marca la que hoy tiene esa regla. Solo se baja a minúsculas: el nombre no
-- lleva tildes, así que no hace falta `unaccent` — que además es una extensión
-- de PostgreSQL que puede no estar instalada y haría fallar la migración entera.
UPDATE "categories"
   SET "requires_dimensions" = true
 WHERE lower("category_name") = 'muebles y enseres';
