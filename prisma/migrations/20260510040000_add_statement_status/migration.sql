-- AlterTable: add approval status fields to statement_records
ALTER TABLE "statement_records"
ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD COLUMN "approved_by_teacher_id" INTEGER,
ADD COLUMN "approved_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "statement_records"
ADD CONSTRAINT "statement_records_approved_by_teacher_id_fkey"
FOREIGN KEY ("approved_by_teacher_id") REFERENCES "teachers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
