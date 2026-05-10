-- AlterTable: add measures, signatures, and teacher FK columns to statement_records
ALTER TABLE "statement_records"
ADD COLUMN "consideration_measures" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "result_measures" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "measure_notes" TEXT,
ADD COLUMN "student_signature" TEXT,
ADD COLUMN "guardian_signature" TEXT,
ADD COLUMN "advisor_signature" TEXT,
ADD COLUMN "discipline_teacher_id" INTEGER,
ADD COLUMN "grade_head_teacher_id" INTEGER;

-- CreateTable: statement_bonds (สร้างเฉพาะเมื่อมีมาตรการทัณฑ์บน)
CREATE TABLE "statement_bonds" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statement_record_id" INTEGER NOT NULL,
    "guardian_id" INTEGER NOT NULL,
    "penalty_actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deduct_points" INTEGER,
    "witness_name" VARCHAR(200),
    CONSTRAINT "statement_bonds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: statement_bonds.statement_record_id is unique (one-to-one)
CREATE UNIQUE INDEX "statement_bonds_statement_record_id_key" ON "statement_bonds"("statement_record_id");

-- AddForeignKey: discipline teacher and grade head teacher on statement_records
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_discipline_teacher_id_fkey" FOREIGN KEY ("discipline_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_grade_head_teacher_id_fkey" FOREIGN KEY ("grade_head_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: statement_bonds → statement_records and guardians
ALTER TABLE "statement_bonds" ADD CONSTRAINT "statement_bonds_statement_record_id_fkey" FOREIGN KEY ("statement_record_id") REFERENCES "statement_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "statement_bonds" ADD CONSTRAINT "statement_bonds_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
