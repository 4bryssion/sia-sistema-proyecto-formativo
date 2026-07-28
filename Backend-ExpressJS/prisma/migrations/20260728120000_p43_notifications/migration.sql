-- (P43) Notificaciones / logs del sistema
CREATE TYPE "NotificationSeverity" AS ENUM ('Critica', 'Advertencia', 'Informativa');

CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "severity" "NotificationSeverity" NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "user_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
