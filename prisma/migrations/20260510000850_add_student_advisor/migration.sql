-- CreateTable
CREATE TABLE "student_advisors" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "student_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "student_advisors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statement_records" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "student_id" INTEGER NOT NULL,
    "record_date" DATE NOT NULL,
    "semester" INTEGER NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "violation_category" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "recorded_by" VARCHAR(100) NOT NULL,

    CONSTRAINT "statement_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_advisor_teacher" ON "student_advisors"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_student_advisor_slot" ON "student_advisors"("student_id", "slot");

-- CreateIndex
CREATE INDEX "idx_statement_student" ON "statement_records"("student_id");

-- CreateIndex
CREATE INDEX "idx_statement_date" ON "statement_records"("record_date");

-- AddForeignKey
ALTER TABLE "student_advisors" ADD CONSTRAINT "student_advisors_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_advisors" ADD CONSTRAINT "student_advisors_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
