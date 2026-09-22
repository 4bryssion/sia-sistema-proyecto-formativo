-- p50 — Huella del archivo de una cotización
--
-- EL PROBLEMA
--
-- Nada impedía cargar el mismo PDF veinte veces: cada carga creaba una
-- cotización distinta, con su id, y todas con el mismo contenido. En el select
-- de asignar aparecían varias filas con la misma etiqueta y no había forma de
-- saber cuál era cuál.
--
-- POR QUÉ POR CONTENIDO Y NO POR NOMBRE
--
-- El nombre es una pista débil en las dos direcciones: no detecta el mismo PDF
-- que alguien renombró a `cotizacion_final_v2.pdf` —que es justo como se cuelan
-- los duplicados— y se queja de dos cotizaciones distintas que se llaman las dos
-- `cotizacion.pdf`. La huella SHA-256 del contenido no falla en ninguna de las
-- dos. Medido en el equipo de desarrollo: 10 ms por archivo de 10MB, sobre una
-- carga que mueve ese archivo por la red.
--
-- POR QUÉ NO ES UNIQUE
--
-- Porque cargar un duplicado a propósito tiene que seguir siendo posible. El
-- sistema AVISA de que ya existe y ofrece usar la que hay; si aun así se quiere
-- una copia —otra versión firmada del mismo documento, por ejemplo— se carga.
-- Un UNIQUE convertiría un aviso útil en un muro.
--
-- NULL significa "cargada antes de esta migración". Esas no participan en la
-- detección hasta que se les calcule la huella:
--
--     npm run hashear-cotizaciones
--
-- Se hace con un script y no aquí porque hay que LEER cada archivo del disco, y
-- eso una migración de SQL no lo puede hacer.

ALTER TABLE "quotations" ADD COLUMN "file_hash" CHAR(64);

-- La única consulta que usa esta columna es "¿existe ya alguna con esta huella?",
-- que corre antes de cada carga.
CREATE INDEX "quotations_file_hash_idx" ON "quotations"("file_hash");
