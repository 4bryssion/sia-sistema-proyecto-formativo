-- (p51) Una tarea, varios encargados, cada uno con su propio estado.
--
-- Hasta ahora `tasks` llevaba `user_id` y `task_status`: una tarea era de una
-- persona y tenía UN estado. La misma tarea para cinco aprendices obligaba a
-- crearla cinco veces, y marcar una como completada no decía nada de las otras
-- cuatro.
--
-- La asignación pasa a ser una entidad: quién, de qué tarea, y en qué estado la
-- lleva ESA persona. La asignación individual no desaparece —es el caso de una
-- sola fila— así que no hay dos formas de asignar, solo una que admite varias.

CREATE TABLE "task_assignments" (
    "id_task_assignation" SERIAL       NOT NULL,
    "id_tarea"            INTEGER      NOT NULL,
    "id_user"             INTEGER      NOT NULL,
    -- El estado vive AQUÍ, no en la tarea: es lo que hace que cada persona
    -- avance por su cuenta. Reutiliza el enum que ya existía.
    "state_task"          "TaskStatus" NOT NULL DEFAULT 'en_progreso',
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id_task_assignation")
);

-- La misma tarea no se le asigna dos veces a la misma persona: serían dos
-- estados para un solo encargo y ninguna pantalla sabría cuál enseñar.
CREATE UNIQUE INDEX "task_assignments_id_tarea_id_user_key"
  ON "task_assignments" ("id_tarea", "id_user");

-- "Mis tareas" consulta por usuario en cada carga de esa pantalla.
CREATE INDEX "task_assignments_id_user_idx" ON "task_assignments" ("id_user");

ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_id_tarea_fkey"
  FOREIGN KEY ("id_tarea") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RESTRICT y no CASCADE: borrar un usuario con tareas asignadas tiene que
-- fallar, no llevarse su historial por delante. El sistema da de baja a la
-- gente con `is_active`, no borrándola.
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_id_user_fkey"
  FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Traspaso de lo que ya existe. Cada tarea tenía exactamente un encargado y un
-- estado, así que sale una asignación por tarea y no se pierde nada: las fechas
-- se copian para que el histórico siga diciendo cuándo se asignó.
INSERT INTO "task_assignments" ("id_tarea", "id_user", "state_task", "created_at", "updated_at")
SELECT "id", "user_id", "task_status", "created_at", "updated_at"
FROM "tasks";

-- Y las dos columnas dejan de existir. Mantenerlas "por si acaso" dejaría dos
-- fuentes de verdad para el mismo dato, y tarde o temprano una de las dos
-- quedaría desactualizada sin que nadie se diera cuenta.
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_user_id_fkey";
ALTER TABLE "tasks" DROP COLUMN "user_id";
ALTER TABLE "tasks" DROP COLUMN "task_status";
