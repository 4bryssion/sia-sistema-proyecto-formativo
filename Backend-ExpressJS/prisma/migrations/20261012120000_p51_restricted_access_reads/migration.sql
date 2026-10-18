-- (p51) Las dos lecturas del dominio de accesos también son de administración.
--
-- `list_permissions` y `list_groups` eran los únicos permisos de ese dominio sin
-- marcar. No cambian nada —solo leen—, pero `list_permissions` es el que abre el
-- panel de accesos: concedérselo a un rol cualquiera le enseña la estructura
-- completa de quién puede qué en el sistema. Eso es información de seguridad, y
-- repartirla es decisión del superadministrador.
--
-- Recordatorio de lo que significa la marca: no es "no lo tiene", es "no puede
-- regalarlo". El Administrador conserva los dos y sigue entrando al panel; lo
-- que no puede es dárselos a un rol nuevo.

UPDATE "permissions" SET "is_restricted" = TRUE
WHERE "permission_codename" IN ('list_permissions', 'list_groups');
