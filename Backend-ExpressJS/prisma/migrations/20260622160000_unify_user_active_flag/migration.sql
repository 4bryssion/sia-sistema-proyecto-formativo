-- Unificar estado de User en un único campo isActive
-- Renombrar user_is_active → is_active (conserva datos)
ALTER TABLE "users" RENAME COLUMN "user_is_active" TO "is_active";

-- Eliminar user_status (redundante con is_active)
ALTER TABLE "users" DROP COLUMN "user_status";
