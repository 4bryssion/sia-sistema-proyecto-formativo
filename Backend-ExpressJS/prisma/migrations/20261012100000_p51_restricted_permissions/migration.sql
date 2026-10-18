-- (p51) Permisos de administración y seguridad del sistema.
--
-- Antes la regla era "nadie concede un permiso que no tiene". Protegía contra la
-- escalada, pero era más estrecha de lo que el proyecto necesita: un
-- Administrador no podía darle `create_category` a un rol nuevo, y eso es
-- inventario puro — justo lo que un Administrador debe poder repartir.
--
-- La regla pasa a ser por TIER: hay un conjunto pequeño de permisos que deciden
-- quién puede qué (la auditoría, el catálogo de permisos, la administración de
-- roles y el reparto de permisos y grupos). Esos solo los concede un
-- superadministrador. Todo lo demás —usuarios, materiales, préstamos, tareas,
-- marcas, inventarios, categorías, tipos de documento, cotizaciones, reportes—
-- lo reparte en su totalidad cualquiera con permiso para repartir, lo tenga él
-- o no.
--
-- Va en el dato y no en una lista dentro del código por lo mismo que `is_system`
-- en los roles: así el panel de administración puede mostrarlo, y marcar o
-- desmarcar uno no obliga a tocar una línea.

ALTER TABLE "permissions" ADD COLUMN "is_restricted" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "permissions" SET "is_restricted" = TRUE
WHERE "permission_codename" IN (
  -- El rastro de lo que hizo cada quien, administradores incluidos.
  'download_audit',
  -- El catálogo de permisos: quien lo edita define el vocabulario entero.
  'create_permission', 'edit_permission', 'toggle_permission',
  -- La administración de roles.
  'create_group', 'edit_group', 'toggle_group',
  -- Quién reparte permisos y grupos. Es el permiso que multiplica a los demás:
  -- concederlo es conceder la capacidad de conceder.
  'assign_permission_to_group', 'remove_permission_from_group',
  'assign_permission_to_user',  'remove_permission_from_user',
  'assign_group_to_user',       'remove_group_from_user'
);

-- (p51) `select_users` — leer usuarios para los selectores, sin entrar al módulo.
--
-- `list_users` hacía dos trabajos: "ver la tabla de usuarios" y "leer usuarios
-- para un desplegable". El Instructor lo tenía por el segundo motivo, pero eso
-- obligaba a guardar la pantalla de usuarios con `create_user`/`edit_user` en
-- vez de con `list_users`, que es lo que cualquiera espera. Separados, cada
-- permiso dice una sola cosa.
INSERT INTO "permissions" ("permission_name", "permission_codename", "content_type_id", "is_active", "created_at", "updated_at")
SELECT 'Leer usuarios en los selectores', 'select_users', ct."content_type_id", TRUE, NOW(), NOW()
FROM "content_type" ct
WHERE ct."app_label" = 'users'
ON CONFLICT ("permission_codename") DO NOTHING;

-- Quien tenía `list_users` solo para los selectores conserva exactamente lo que
-- podía hacer: se le añade el nuevo y se le quita el viejo. Los roles que
-- administran usuarios (SuperAdmin y Administrador) mantienen los dos.
INSERT INTO "group_permissions" ("group_id", "permission_id")
SELECT gp."group_id", (SELECT id FROM "permissions" WHERE "permission_codename" = 'select_users')
FROM "group_permissions" gp
JOIN "permissions" p ON p.id = gp."permission_id"
WHERE p."permission_codename" = 'list_users'
ON CONFLICT DO NOTHING;

DELETE FROM "group_permissions"
WHERE "permission_id" = (SELECT id FROM "permissions" WHERE "permission_codename" = 'list_users')
  AND "group_id" IN (
    SELECT id FROM "groups"
    WHERE "group_name" NOT IN ('SuperAdmin', 'Administrador')
  );
