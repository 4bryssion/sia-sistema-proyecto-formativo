-- (p51) Grupos del sistema.
--
-- El Excel exige que el rol «Administrador» no se pueda renombrar (RFADMIN43.1)
-- ni deshabilitar (RFADMIN44.1), y que el SuperAdmin conserve siempre todos sus
-- permisos (RFADMIN45.1). Hacerlo comparando el nombre del grupo en el código
-- rompería el principio del proyecto —nada se decide por nombre de grupo— y
-- dejaría de proteger en silencio el día que alguien renombre el rol en la base.
--
-- Así que la condición vive en el dato: un grupo marcado como del sistema no se
-- renombra ni se deshabilita, y mañana se marca otro sin tocar una línea de
-- código. El SuperAdmin sigue además acoplado por nombre en systemIdentities.js,
-- porque es la identidad que resuelve `isSuperUser`, y eso no cambia aquí.

ALTER TABLE "groups" ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT FALSE;

-- Los dos que el documento protege. Se marcan por nombre UNA vez, aquí, porque
-- es el único momento en que el nombre es la referencia disponible; a partir de
-- ahora manda la columna.
UPDATE "groups" SET "is_system" = TRUE WHERE "group_name" IN ('SuperAdmin', 'Administrador');
