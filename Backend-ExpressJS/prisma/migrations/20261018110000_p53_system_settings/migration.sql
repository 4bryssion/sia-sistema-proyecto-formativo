-- p53 — Ajustes del sistema, empezando por el correo de soporte
--
-- Por qué una tabla y no una constante: el correo de soporte estaba escrito en
-- el código del frontend (`SupportContactButton.jsx`) con un aviso de
-- «PLACEHOLDER, reemplazar antes de la sustentación». El instructor pide que se
-- pueda cambiar desde «Mi perfil» con la sesión iniciada, y que el cambio se vea
-- también en el modal de soporte del login — que es una pantalla SIN sesión. Un
-- valor que dos pantallas leen y una escribe no puede vivir en el código.
--
-- Por qué clave/valor y no una columna por ajuste: el siguiente ajuste que
-- aparezca (teléfono de soporte, horario de atención, nombre del centro) es una
-- fila, no una migración. La validación de cada clave vive en el backend, que es
-- donde se sabe que `support_email` tiene que ser un correo.

CREATE TABLE "system_settings" (
  "id"            SERIAL       PRIMARY KEY,
  -- La clave es el identificador real: se busca por ella, nunca por el id.
  "setting_key"   VARCHAR(60)  NOT NULL,
  "setting_value" VARCHAR(255) NOT NULL,
  -- Quién lo cambió por última vez. SET NULL y no RESTRICT: el ajuste es del
  -- sistema y debe sobrevivir a la baja de quien lo tocó.
  "updated_by"    INTEGER      REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Sin DEFAULT a propósito: lo escribe Prisma con @updatedAt, y un default en
  -- la base haría que `migrate dev` pidiera una migración nueva en cada
  -- ejecución (ya pasó en p51 con task_assignments).
  "updated_at"    TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- El valor de arranque es el que estaba escrito en el frontend, para que la
-- pantalla no cambie de comportamiento al desplegar: lo que cambia es que ahora
-- se puede editar.
INSERT INTO "system_settings" ("setting_key", "setting_value", "updated_at")
VALUES ('support_email', 'superadmin@sia.local', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- El permiso que gobierna este ajuste
-- ---------------------------------------------------------------------------
-- Se declara también aquí, y no solo en el catálogo, para que una base levantada
-- con `migrate deploy` quede coherente sin depender del seed. Es el mismo patrón
-- de p51 con `select_users`: si el tipo de contenido todavía no existe (lo crea
-- el seed o `npm run sincronizar-permisos`), el INSERT no inserta nada y el
-- script lo completa después.
--
-- `ON CONFLICT DO NOTHING` sin columna a propósito: `permissions` tiene DOS
-- índices únicos (codename y nombre visible) y nombrar solo uno dejaría que el
-- otro abortara la migración.
INSERT INTO "content_type" ("app_label", "model", "display_name")
VALUES ('settings', 'systemSetting', 'Ajustes del sistema')
ON CONFLICT DO NOTHING;

INSERT INTO "permissions" ("permission_name", "permission_codename", "content_type_id", "is_active", "is_restricted", "created_at", "updated_at")
SELECT 'Editar el correo de soporte', 'edit_support_email', ct."content_type_id", TRUE, TRUE, NOW(), NOW()
  FROM "content_type" ct
 WHERE ct."app_label" = 'settings' AND ct."model" = 'systemSetting'
ON CONFLICT DO NOTHING;

-- Y si el permiso ya existía (base sembrada antes de esta migración), se marca.
UPDATE "permissions"
   SET "is_restricted" = TRUE
 WHERE "permission_codename" = 'edit_support_email';
