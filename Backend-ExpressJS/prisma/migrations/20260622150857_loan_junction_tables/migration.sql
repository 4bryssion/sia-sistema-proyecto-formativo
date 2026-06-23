/*
  Warnings:

  - You are about to drop the column `borrowed_quantity` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `material_id` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `loans` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('Pendiente_confirmacion', 'Activo', 'Finalizado');

-- CreateEnum
CREATE TYPE "LoanParty" AS ENUM ('Prestador', 'Receptor');

-- DropForeignKey
ALTER TABLE "loan_returns" DROP CONSTRAINT "loan_returns_loan_id_fkey";

-- DropForeignKey
ALTER TABLE "loan_returns" DROP CONSTRAINT "loan_returns_material_id_fkey";

-- DropForeignKey
ALTER TABLE "loans" DROP CONSTRAINT "loans_material_id_fkey";

-- DropForeignKey
ALTER TABLE "loans" DROP CONSTRAINT "loans_user_id_fkey";

-- AlterTable
ALTER TABLE "loans" DROP COLUMN "borrowed_quantity",
DROP COLUMN "material_id",
DROP COLUMN "user_id",
ADD COLUMN     "status" "LoanStatus" NOT NULL DEFAULT 'Pendiente_confirmacion';

-- CreateTable
CREATE TABLE "loan_materials" (
    "loan_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "borrowed_quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_materials_pkey" PRIMARY KEY ("loan_id","material_id")
);

-- CreateTable
CREATE TABLE "loan_signatures" (
    "loan_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "party" "LoanParty" NOT NULL,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signed_at" TIMESTAMP(3),

    CONSTRAINT "loan_signatures_pkey" PRIMARY KEY ("loan_id","party")
);

-- AddForeignKey
ALTER TABLE "loan_materials" ADD CONSTRAINT "loan_materials_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_materials" ADD CONSTRAINT "loan_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "consumable_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_signatures" ADD CONSTRAINT "loan_signatures_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_signatures" ADD CONSTRAINT "loan_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_returns" ADD CONSTRAINT "loan_returns_loan_id_material_id_fkey" FOREIGN KEY ("loan_id", "material_id") REFERENCES "loan_materials"("loan_id", "material_id") ON DELETE RESTRICT ON UPDATE CASCADE;
