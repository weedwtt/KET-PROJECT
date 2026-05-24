-- AlterTable
ALTER TABLE "statement_records" ADD COLUMN     "signature_teacher_id" INTEGER;

-- AddForeignKey
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_signature_teacher_id_fkey" FOREIGN KEY ("signature_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
