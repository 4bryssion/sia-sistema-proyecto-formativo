-- Rename enum types from Spanish to English
ALTER TYPE "TipoCuentadante" RENAME TO "AccountType";
ALTER TYPE "EstadoMaterial" RENAME TO "MaterialStatus";

-- document_types
ALTER TABLE "document_types" RENAME COLUMN "nombre_documento" TO "document_name";
ALTER TABLE "document_types" RENAME COLUMN "descripcion" TO "description";
ALTER INDEX "tipos_documento_nombre_documento_key" RENAME TO "document_types_document_name_key";

-- groups
ALTER TABLE "groups" RENAME COLUMN "nombre_grupo" TO "group_name";
ALTER INDEX "grupos_nombre_grupo_key" RENAME TO "groups_group_name_key";

-- permissions
ALTER TABLE "permissions" RENAME COLUMN "nombre_permiso" TO "permission_name";
ALTER TABLE "permissions" RENAME COLUMN "descripcion" TO "description";
ALTER INDEX "permisos_nombre_permiso_key" RENAME TO "permissions_permission_name_key";

-- group_permissions
ALTER TABLE "group_permissions" RENAME COLUMN "grupo_id" TO "group_id";
ALTER TABLE "group_permissions" RENAME COLUMN "permiso_id" TO "permission_id";

-- users
ALTER TABLE "users" RENAME COLUMN "id_tipo_documento" TO "document_type_id";
ALTER TABLE "users" RENAME COLUMN "nombre" TO "user_first_name";
ALTER TABLE "users" RENAME COLUMN "apellido" TO "user_last_name";
ALTER TABLE "users" RENAME COLUMN "numero_documento" TO "user_document_number";
ALTER TABLE "users" RENAME COLUMN "fecha_finalizacion" TO "user_end_date";
ALTER TABLE "users" RENAME COLUMN "email" TO "user_email";
ALTER TABLE "users" RENAME COLUMN "telefono" TO "user_phone";
ALTER TABLE "users" RENAME COLUMN "segundo_telefono" TO "user_second_phone";
ALTER TABLE "users" RENAME COLUMN "direccion" TO "user_address";
ALTER TABLE "users" RENAME COLUMN "estado" TO "user_is_active";
ALTER TABLE "users" RENAME COLUMN "foto" TO "user_photo";
ALTER TABLE "users" RENAME COLUMN "password" TO "user_password";
ALTER TABLE "users" RENAME COLUMN "cuentadante" TO "user_account_type";
ALTER TABLE "users" RENAME COLUMN "fecha_inicio" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "fecha_actualizacion" TO "updated_at";
ALTER INDEX "usuarios_numero_documento_key" RENAME TO "users_user_document_number_key";
ALTER INDEX "usuarios_email_key" RENAME TO "users_user_email_key";
ALTER INDEX "usuarios_foto_key" RENAME TO "users_user_photo_key";

-- user_groups
ALTER TABLE "user_groups" RENAME COLUMN "usuario_id" TO "user_id";
ALTER TABLE "user_groups" RENAME COLUMN "grupo_id" TO "group_id";

-- user_permissions
ALTER TABLE "user_permissions" RENAME COLUMN "usuario_id" TO "user_id";
ALTER TABLE "user_permissions" RENAME COLUMN "permiso_id" TO "permission_id";

-- brands
ALTER TABLE "brands" RENAME COLUMN "nombre_marca" TO "brand_name";
ALTER INDEX "marcas_nombre_marca_key" RENAME TO "brands_brand_name_key";

-- categories
ALTER TABLE "categories" RENAME COLUMN "nombre_categoria" TO "category_name";
ALTER INDEX "categorias_nombre_categoria_key" RENAME TO "categories_category_name_key";

-- consumable_materials
ALTER TABLE "consumable_materials" RENAME COLUMN "id_usuario" TO "user_id";
ALTER TABLE "consumable_materials" RENAME COLUMN "id_marca" TO "brand_id";
ALTER TABLE "consumable_materials" RENAME COLUMN "placa_sena" TO "sena_plate";
ALTER TABLE "consumable_materials" RENAME COLUMN "nombre_material" TO "material_name";
ALTER TABLE "consumable_materials" RENAME COLUMN "imagen" TO "image";
ALTER TABLE "consumable_materials" RENAME COLUMN "cantidad" TO "quantity";
ALTER TABLE "consumable_materials" RENAME COLUMN "valor_unitario" TO "unit_price";
ALTER TABLE "consumable_materials" RENAME COLUMN "valor_total" TO "total_price";
ALTER TABLE "consumable_materials" RENAME COLUMN "estado" TO "status";
ALTER TABLE "consumable_materials" RENAME COLUMN "descripcion" TO "description";
ALTER TABLE "consumable_materials" RENAME COLUMN "fecha_compra" TO "purchase_date";
ALTER TABLE "consumable_materials" RENAME COLUMN "ubicacion" TO "location";
ALTER INDEX "materiales_consumo_placa_sena_key" RENAME TO "consumable_materials_sena_plate_key";

-- returnable_materials
ALTER TABLE "returnable_materials" RENAME COLUMN "id_categoria" TO "category_id";
ALTER TABLE "returnable_materials" RENAME COLUMN "modelo" TO "model";
ALTER TABLE "returnable_materials" RENAME COLUMN "ficha_tecnica" TO "technical_sheet";
ALTER TABLE "returnable_materials" RENAME COLUMN "dimensiones" TO "dimensions";
ALTER INDEX "materiales_devolutivo_serial_key" RENAME TO "returnable_materials_serial_key";

-- loans
ALTER TABLE "loans" RENAME COLUMN "id_usuario" TO "user_id";
ALTER TABLE "loans" RENAME COLUMN "id_material" TO "material_id";
ALTER TABLE "loans" RENAME COLUMN "cantidad_prestada" TO "borrowed_quantity";
ALTER TABLE "loans" RENAME COLUMN "grupo_aprendices" TO "apprentice_group";
ALTER TABLE "loans" RENAME COLUMN "justificacion_uso" TO "use_justification";
ALTER TABLE "loans" RENAME COLUMN "fecha_devolucion" TO "return_date";
ALTER TABLE "loans" RENAME COLUMN "fecha_prestamo" TO "loan_date";

-- loan_returns
ALTER TABLE "loan_returns" RENAME COLUMN "id_prestamo" TO "loan_id";
ALTER TABLE "loan_returns" RENAME COLUMN "id_material" TO "material_id";
ALTER TABLE "loan_returns" RENAME COLUMN "cantidad_sobrante" TO "remaining_quantity";
ALTER TABLE "loan_returns" RENAME COLUMN "observaciones" TO "observations";
ALTER TABLE "loan_returns" RENAME COLUMN "fecha_devolucion" TO "return_date";

-- tasks
ALTER TABLE "tasks" RENAME COLUMN "id_usuario" TO "user_id";
ALTER TABLE "tasks" RENAME COLUMN "nombre_tarea" TO "task_name";
ALTER TABLE "tasks" RENAME COLUMN "descripcion" TO "description";
ALTER TABLE "tasks" RENAME COLUMN "estado" TO "is_active";
