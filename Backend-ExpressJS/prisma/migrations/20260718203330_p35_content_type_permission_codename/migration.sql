/*
  Warnings:

  - You are about to drop the column `description` on the `permissions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[permission_codename]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `permission_codename` to the `permissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "description",
ADD COLUMN     "content_type_id" INTEGER,
ADD COLUMN     "permission_codename" VARCHAR(100) NOT NULL,
ALTER COLUMN "permission_name" SET DATA TYPE VARCHAR(150);

-- CreateTable
CREATE TABLE "content_type" (
    "content_type_id" SERIAL NOT NULL,
    "app_label" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL DEFAULT '',

    CONSTRAINT "content_type_pkey" PRIMARY KEY ("content_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_content_type" ON "content_type"("app_label", "model");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_codename_key" ON "permissions"("permission_codename");

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "fk_permissions_content_type" FOREIGN KEY ("content_type_id") REFERENCES "content_type"("content_type_id") ON DELETE SET NULL ON UPDATE CASCADE;
