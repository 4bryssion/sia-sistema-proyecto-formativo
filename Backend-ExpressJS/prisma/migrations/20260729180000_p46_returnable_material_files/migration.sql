-- Fichas técnicas del material devolutivo: de una columna a una tabla hija (p46).
--
-- Por qué: la ficha técnica pasó de ser un archivo a ser hasta 3 (PDF o Excel).
-- Una columna de texto no puede guardar varios archivos sin inventar un formato
-- (JSON o separadores) que la BD no podría consultar ni validar.
--
-- La imagen NO se toca: sigue en consumable_materials.image, que es la tabla
-- padre de AMBOS tipos de material. Moverla obligaría a rehacer el módulo de
-- consumibles, y hoy el devolutivo sigue teniendo una sola imagen.
CREATE TABLE "returnable_material_files" (
    "id"          SERIAL       NOT NULL,
    "material_id" INTEGER      NOT NULL,
    "file_url"    VARCHAR(255) NOT NULL,
    "file_name"   VARCHAR(255) NOT NULL,
    "mime_type"   VARCHAR(100) NOT NULL,
    -- Posición elegida por el usuario al arrastrar las previsualizaciones.
    -- Sin esta columna el orden dependería del id, que solo refleja el orden de
    -- subida y cambiaría al reemplazar un archivo.
    "sort_order"  INTEGER      NOT NULL DEFAULT 0,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "returnable_material_files_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "returnable_material_files_material_id_idx"
    ON "returnable_material_files"("material_id");

-- ON DELETE CASCADE: las fichas no tienen sentido sin su material. El material
-- devolutivo ya se borra en cascada desde consumable_materials, así que sin
-- cascada aquí ese borrado fallaría por la FK.
ALTER TABLE "returnable_material_files"
    ADD CONSTRAINT "returnable_material_files_material_id_fkey"
    FOREIGN KEY ("material_id") REFERENCES "returnable_materials"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Traslado de las fichas ya cargadas ANTES de eliminar la columna: si no, se
-- perderían los archivos de los materiales existentes.
-- El nombre se deriva de la ruta (/uploads/<archivo>) y el tipo de la extensión,
-- porque la columna vieja solo guardaba la ruta.
INSERT INTO "returnable_material_files" ("material_id", "file_url", "file_name", "mime_type", "sort_order")
SELECT
    "id",
    "technical_sheet",
    regexp_replace("technical_sheet", '^.*/', ''),
    CASE
        WHEN lower("technical_sheet") LIKE '%.pdf'  THEN 'application/pdf'
        WHEN lower("technical_sheet") LIKE '%.xlsx' THEN 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        WHEN lower("technical_sheet") LIKE '%.xls'  THEN 'application/vnd.ms-excel'
        ELSE 'application/octet-stream'
    END,
    0
FROM "returnable_materials"
WHERE "technical_sheet" IS NOT NULL AND "technical_sheet" <> '';

ALTER TABLE "returnable_materials" DROP COLUMN "technical_sheet";
