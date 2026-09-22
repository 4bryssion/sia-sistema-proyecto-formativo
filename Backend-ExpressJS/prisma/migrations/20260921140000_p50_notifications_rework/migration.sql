-- p50 — Rework de notificaciones
--
-- QUÉ CAMBIA Y POR QUÉ
--
-- Hasta ahora `notifications` era el registro general del sistema: 30 llamadas a
-- notify() repartidas en 9 módulos escribían aquí cualquier cosa que pasara. Esa
-- función pasó a `audit_log` (extensión de Prisma, p50), que la hace completa y
-- automática. Lo que queda aquí es otra cosa distinta y mucho más pequeña: un
-- aviso para una persona concreta.
--
-- A partir de esta migración solo existen TRES eventos que generan notificación:
--   1. Se realizó un préstamo          → para administradores
--   2. Se solicitó una devolución      → para administradores
--   3. Se te asignó una tarea          → para la persona asignada
--
-- Todo lo demás (marcas, inventarios, usuarios, materiales, retornos, cambios de
-- estado) deja de notificarse: ya queda en la auditoría, que además guarda el
-- valor anterior y el posterior, cosa que una notificación nunca guardó.

-- 1. Purga de los registros existentes.
--    No se conservan porque pertenecen a la semántica anterior: son avisos de
--    módulos que ya no notifican, dirigidos a nadie en particular. Dejarlos
--    haría que la primera pantalla tras el cambio mezclara dos sistemas.
--    Lo que esos registros documentaban no se pierde de aquí en adelante: lo
--    recoge `audit_log`.
DELETE FROM "notifications";

-- 2. Destinatario.
--
--    `user_id` ya existía y significa AUTOR (quién ejecutó la acción); se queda
--    como está, porque es lo que la columna "Responsable" del listado muestra.
--    Lo que faltaba era a QUIÉN va dirigido el aviso, que es una pregunta
--    distinta: una tarea la asigna un administrador (autor) pero le llega al
--    aprendiz (destinatario).
--
--    NULL significa "para los administradores": los préstamos y las devoluciones
--    no van dirigidos a una persona concreta.
ALTER TABLE "notifications" ADD COLUMN "recipient_id" INTEGER;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey"
    FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Las dos únicas consultas que existen: "mis avisos, del más reciente hacia
-- atrás" y "los últimos avisos para administradores".
CREATE INDEX "notifications_recipient_created_idx"
    ON "notifications"("recipient_id", "created_at" DESC);

-- 3. `is_active` se elimina.
--
--    Nació como un archivado que nunca se implementó: ninguna ruta lo cambiaba y
--    ningún registro dejó de valer true en toda la vida de la tabla. Un campo que
--    solo puede tener un valor no informa de nada y obliga a filtrarlo en cada
--    consulta. El archivado real de un aviso es que deje de estar entre los
--    últimos: por eso el listado de administradores se limita a 10.
ALTER TABLE "notifications" DROP COLUMN "is_active";

-- 4. Punto verde de la campana.
--
--    Marca cuándo fue la última vez que la persona abrió sus notificaciones. El
--    punto se enciende si hay algún aviso suyo posterior a esa marca.
--
--    Va en `users` y no en una tabla de "leídos por aviso" a propósito: la
--    pregunta que hay que responder es "¿hay algo nuevo?", no "¿cuáles vi?".
--    Una fila por persona responde eso; una tabla de leídos crecería con el
--    producto de personas por avisos para responder lo mismo.
--
--    NULL = nunca las ha abierto: entonces cualquier aviso suyo cuenta como
--    nuevo, que es el comportamiento correcto para alguien que acaba de entrar.
ALTER TABLE "users" ADD COLUMN "notifications_seen_at" TIMESTAMP(3);
