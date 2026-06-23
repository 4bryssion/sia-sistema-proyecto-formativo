-- AlterTable
ALTER TABLE "users" ADD COLUMN "user_email_institutional" VARCHAR(150);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_email_institutional_key" ON "users"("user_email_institutional");
