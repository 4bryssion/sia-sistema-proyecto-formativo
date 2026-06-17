-- AlterTable
ALTER TABLE "brands" RENAME CONSTRAINT "marcas_pkey" TO "brands_pkey";
ALTER TABLE "brands" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "categories" RENAME CONSTRAINT "categorias_pkey" TO "categories_pkey";
ALTER TABLE "categories" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "consumable_materials" RENAME CONSTRAINT "materiales_consumo_pkey" TO "consumable_materials_pkey";
ALTER TABLE "consumable_materials" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "document_types" RENAME CONSTRAINT "tipos_documento_pkey" TO "document_types_pkey";
ALTER TABLE "document_types" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "group_permissions" RENAME CONSTRAINT "grupo_permisos_pkey" TO "group_permissions_pkey";

-- AlterTable
ALTER TABLE "groups" RENAME CONSTRAINT "grupos_pkey" TO "groups_pkey";
ALTER TABLE "groups" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "loan_returns" RENAME CONSTRAINT "retornos_prestamo_pkey" TO "loan_returns_pkey";
ALTER TABLE "loan_returns" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "loans" RENAME CONSTRAINT "prestamos_pkey" TO "loans_pkey";
ALTER TABLE "loans" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "permissions" RENAME CONSTRAINT "permisos_pkey" TO "permissions_pkey";
ALTER TABLE "permissions" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "returnable_materials" RENAME CONSTRAINT "materiales_devolutivo_pkey" TO "returnable_materials_pkey";

-- AlterTable
ALTER TABLE "tasks" RENAME CONSTRAINT "tareas_pkey" TO "tasks_pkey";
ALTER TABLE "tasks" ADD COLUMN "task_status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "user_groups" RENAME CONSTRAINT "usuario_grupos_pkey" TO "user_groups_pkey";

-- AlterTable
ALTER TABLE "user_permissions" RENAME CONSTRAINT "usuario_permisos_pkey" TO "user_permissions_pkey";

-- AlterTable
ALTER TABLE "users" RENAME CONSTRAINT "usuarios_pkey" TO "users_pkey";
ALTER TABLE "users" ADD COLUMN "user_status" BOOLEAN NOT NULL DEFAULT true;

-- RenameForeignKey
ALTER TABLE "consumable_materials" RENAME CONSTRAINT "materiales_consumo_id_marca_fkey" TO "consumable_materials_brand_id_fkey";

-- RenameForeignKey
ALTER TABLE "consumable_materials" RENAME CONSTRAINT "materiales_consumo_id_usuario_fkey" TO "consumable_materials_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "group_permissions" RENAME CONSTRAINT "grupo_permisos_grupo_id_fkey" TO "group_permissions_group_id_fkey";

-- RenameForeignKey
ALTER TABLE "group_permissions" RENAME CONSTRAINT "grupo_permisos_permiso_id_fkey" TO "group_permissions_permission_id_fkey";

-- RenameForeignKey
ALTER TABLE "loan_returns" RENAME CONSTRAINT "retornos_prestamo_id_material_fkey" TO "loan_returns_material_id_fkey";

-- RenameForeignKey
ALTER TABLE "loan_returns" RENAME CONSTRAINT "retornos_prestamo_id_prestamo_fkey" TO "loan_returns_loan_id_fkey";

-- RenameForeignKey
ALTER TABLE "loans" RENAME CONSTRAINT "prestamos_id_material_fkey" TO "loans_material_id_fkey";

-- RenameForeignKey
ALTER TABLE "loans" RENAME CONSTRAINT "prestamos_id_usuario_fkey" TO "loans_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "returnable_materials" RENAME CONSTRAINT "materiales_devolutivo_id_categoria_fkey" TO "returnable_materials_category_id_fkey";

-- RenameForeignKey
ALTER TABLE "returnable_materials" RENAME CONSTRAINT "materiales_devolutivo_id_fkey" TO "returnable_materials_id_fkey";

-- RenameForeignKey
ALTER TABLE "tasks" RENAME CONSTRAINT "tareas_id_usuario_fkey" TO "tasks_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_groups" RENAME CONSTRAINT "usuario_grupos_grupo_id_fkey" TO "user_groups_group_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_groups" RENAME CONSTRAINT "usuario_grupos_usuario_id_fkey" TO "user_groups_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_permissions" RENAME CONSTRAINT "usuario_permisos_permiso_id_fkey" TO "user_permissions_permission_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_permissions" RENAME CONSTRAINT "usuario_permisos_usuario_id_fkey" TO "user_permissions_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "users" RENAME CONSTRAINT "usuarios_id_tipo_documento_fkey" TO "users_document_type_id_fkey";
