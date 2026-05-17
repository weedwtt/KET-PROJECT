-- AlterTable
ALTER TABLE "bond_records" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_teacher_id" INTEGER;

-- AddForeignKey
ALTER TABLE "bond_records" ADD CONSTRAINT "bond_records_approved_by_teacher_id_fkey" FOREIGN KEY ("approved_by_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
