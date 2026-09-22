-- DropForeignKey
ALTER TABLE "consumable_materials" DROP CONSTRAINT "consumable_materials_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "loan_signatures" DROP CONSTRAINT "loan_signatures_user_id_fkey";

-- DropForeignKey
ALTER TABLE "material_quotations" DROP CONSTRAINT "material_quotations_material_id_fkey";

-- DropForeignKey
ALTER TABLE "material_quotations" DROP CONSTRAINT "material_quotations_quotation_id_fkey";

-- DropForeignKey
ALTER TABLE "quotations" DROP CONSTRAINT "quotations_uploaded_by_fkey";

-- AlterTable
ALTER TABLE "devolution_requests" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "consumable_materials" ADD CONSTRAINT "consumable_materials_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_quotations" ADD CONSTRAINT "material_quotations_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "consumable_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_quotations" ADD CONSTRAINT "material_quotations_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_signatures" ADD CONSTRAINT "loan_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
