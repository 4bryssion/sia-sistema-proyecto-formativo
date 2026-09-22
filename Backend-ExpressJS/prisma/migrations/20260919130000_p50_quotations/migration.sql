-- p50 — Módulo de cotizaciones
--
-- Una cotización es un PDF que respalda el precio de uno o varios materiales.
-- La relación es de MUCHOS A MUCHOS y asimétrica en sus topes:
--   - un material admite entre 1 y 3 cotizaciones,
--   - una cotización puede respaldar cuantos materiales haga falta.
-- Por eso hay tabla intermedia y no una columna en el material.
--
-- El tope de 3 NO se expresa aquí: una restricción de "como máximo 3 filas por
-- material" exigiría un disparador, y PostgreSQL no lo hace con un CHECK. Se
-- impone en el servicio, que es donde además puede devolverse un mensaje claro.
-- Lo que sí se impide en la base de datos es la asignación repetida (clave
-- primaria compuesta), que es el error que sí puede colarse por concurrencia.

-- =====================================================================
-- 1. Cotizaciones
-- =====================================================================
CREATE TABLE "quotations" (
  "id"          SERIAL       PRIMARY KEY,
  -- Nombre del archivo tal como lo subió la persona: es lo que se muestra en el
  -- listado, porque una cotización no tiene más nombre que el de su archivo.
  "file_name"   VARCHAR(255) NOT NULL,
  "file_url"    VARCHAR(255) NOT NULL,
  "mime_type"   VARCHAR(100) NOT NULL,
  -- Quién la cargó. Opcional y ON DELETE SET NULL: desactivar o borrar a una
  -- persona no puede arrastrarse una cotización que respalda precios.
  "uploaded_by" INTEGER      REFERENCES "users"("id") ON DELETE SET NULL,
  "is_active"   BOOLEAN      NOT NULL DEFAULT true,
  -- Fecha de carga: el listado la muestra como columna propia.
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "quotations_is_active_idx" ON "quotations"("is_active");

-- =====================================================================
-- 2. Asignación material ↔ cotización
-- =====================================================================
-- El material referenciado es SIEMPRE consumable_materials: es la tabla padre,
-- y returnable_materials comparte su clave primaria con ella. Así una sola
-- tabla intermedia sirve para los dos tipos de material, igual que ya ocurre
-- con cuentadantes, imágenes y fichas técnicas.
CREATE TABLE "material_quotations" (
  "material_id"  INTEGER      NOT NULL REFERENCES "consumable_materials"("id") ON DELETE CASCADE,
  "quotation_id" INTEGER      NOT NULL REFERENCES "quotations"("id") ON DELETE CASCADE,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("material_id", "quotation_id")
);

CREATE INDEX "material_quotations_quotation_id_idx" ON "material_quotations"("quotation_id");

-- Los PERMISOS del módulo no se crean aquí sino en el seed, como los de todos
-- los demás módulos. Escribirlos en SQL duplicaría la matriz de permisos por
-- rol que el seed ya mantiene, y un INSERT suelto crearía los permisos sin
-- asignárselos a ningún grupo: existirían y nadie podría usarlos.
