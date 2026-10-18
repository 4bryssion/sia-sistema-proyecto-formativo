-- (p51) Quitar el DEFAULT de `task_assignments.updated_at`.
--
-- La migración que creó la tabla le puso `DEFAULT CURRENT_TIMESTAMP` a las dos
-- columnas de fecha. En `created_at` es correcto y el esquema lo declara
-- (`@default(now())`), pero en `updated_at` no: ahí el esquema solo dice
-- `@updatedAt`, que es cosa de Prisma —escribe el valor en cada actualización—
-- y no se traduce a un valor por defecto en la base.
--
-- Consecuencia: `task_assignments` era la ÚNICA de las siete tablas con fechas
-- que llevaba un default en esa columna, y `prisma migrate dev` detectaba la
-- diferencia entre el esquema y la base en cada ejecución, pidiendo crear una
-- migración nueva sin parar.
--
-- No cambia el comportamiento: Prisma siempre escribe `updated_at` al insertar
-- y al actualizar. Lo que cambia es que el esquema y la base vuelven a decir lo
-- mismo, que es la condición para que las migraciones dejen de acumularse.

ALTER TABLE "task_assignments" ALTER COLUMN "updated_at" DROP DEFAULT;
