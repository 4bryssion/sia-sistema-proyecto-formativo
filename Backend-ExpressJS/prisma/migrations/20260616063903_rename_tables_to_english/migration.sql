-- Rename tables from Spanish to English naming convention
-- Part of P01 backend English conversion

ALTER TABLE "tipos_documento"    RENAME TO "document_types";
ALTER TABLE "grupos"             RENAME TO "groups";
ALTER TABLE "permisos"           RENAME TO "permissions";
ALTER TABLE "grupo_permisos"     RENAME TO "group_permissions";
ALTER TABLE "usuarios"           RENAME TO "users";
ALTER TABLE "usuario_grupos"     RENAME TO "user_groups";
ALTER TABLE "usuario_permisos"   RENAME TO "user_permissions";
ALTER TABLE "marcas"             RENAME TO "brands";
ALTER TABLE "categorias"         RENAME TO "categories";
ALTER TABLE "materiales_consumo"     RENAME TO "consumable_materials";
ALTER TABLE "materiales_devolutivo"  RENAME TO "returnable_materials";
ALTER TABLE "prestamos"          RENAME TO "loans";
ALTER TABLE "retornos_prestamo"  RENAME TO "loan_returns";
ALTER TABLE "tareas"             RENAME TO "tasks";
