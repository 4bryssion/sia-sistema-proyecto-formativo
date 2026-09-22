-- p50 — Registro de auditoría
--
-- Reemplaza a la auditoría escrita a mano. Hasta ahora cada service llamaba a
-- notify() por su cuenta: 30 llamadas repartidas en 9 módulos, y bastaba olvidar
-- una para abrir un hueco. Los huecos reales que había:
--   - auth: los cambios de contraseña no se registraban,
--   - categories y document-types: nada,
--   - group_permissions: cambiar QUÉ PUEDE HACER cada grupo —la operación más
--     sensible del sistema— no dejaba ninguna huella.
--
-- A partir de aquí lo escribe una extensión de Prisma (src/config/audit.js), en
-- un solo sitio y para todos los modelos, así que un módulo nuevo nace auditado
-- sin que nadie se acuerde de nada.
--
-- Diferencia con `notifications`, que se conserva para otra cosa: una
-- notificación es un texto para leer en pantalla; una auditoría necesita saber
-- SOBRE QUÉ registro se actuó y QUÉ valor cambió, que es justo lo que la tabla
-- de notificaciones no guarda.

CREATE TABLE "audit_log" (
  "id"         SERIAL       PRIMARY KEY,
  -- Quién. Opcional porque hay escrituras sin sesión (el seed, la tarea diaria
  -- que desactiva vínculos vencidos) y con SET NULL para que dar de baja a una
  -- persona no borre lo que hizo.
  "actor_id"   INTEGER      REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  -- Qué: CREATE | UPDATE | DELETE
  "action"     VARCHAR(20)  NOT NULL,
  -- Sobre qué modelo y qué fila. `record_id` es texto y no entero porque hay
  -- claves compuestas (material_accountables, group_permissions) que no caben
  -- en un entero.
  "model"      VARCHAR(60)  NOT NULL,
  "record_id"  VARCHAR(120),
  -- Valores antes y después, ya sin los campos sensibles (ver audit.js).
  "before"     JSONB,
  "after"      JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- La consulta habitual es "qué pasó entre estas dos fechas", del más reciente
-- hacia atrás: por eso el índice va por fecha descendente.
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at" DESC);
-- Y la segunda más habitual, "todo lo que se hizo sobre este registro".
CREATE INDEX "audit_log_model_record_idx" ON "audit_log"("model", "record_id");
