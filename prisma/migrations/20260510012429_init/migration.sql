-- This migration restructures statement_records from integer fields to FK-based,
-- adds master tables (semesters, academic_years, violation_categories),
-- and adds the role column to teachers.
-- Runs on top of: add_nint, add_teacher, add_student_advisor.

-- Add role column to teachers (not present in add_teacher migration)
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "role" VARCHAR(50);

-- Drop old statement_records (created in add_student_advisor with plain integer fields)
-- so we can recreate with proper FK columns.
DROP TABLE IF EXISTS "statement_records";

-- CreateTable: master tables
CREATE TABLE IF NOT EXISTS "semesters" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "value" INTEGER NOT NULL,
    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "academic_years" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "violation_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    CONSTRAINT "violation_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: statement_records with FK-based semester/year/category
CREATE TABLE "statement_records" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "student_id" INTEGER NOT NULL,
    "record_date" DATE NOT NULL,
    "semester_id" INTEGER NOT NULL,
    "academic_year_id" INTEGER NOT NULL,
    "violation_category_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "recorded_by" VARCHAR(100) NOT NULL,
    CONSTRAINT "statement_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "semesters_name_key" ON "semesters"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "semesters_value_key" ON "semesters"("value");
CREATE UNIQUE INDEX IF NOT EXISTS "academic_years_year_key" ON "academic_years"("year");
CREATE UNIQUE INDEX IF NOT EXISTS "violation_categories_name_key" ON "violation_categories"("name");
CREATE INDEX IF NOT EXISTS "idx_statement_student" ON "statement_records"("student_id");
CREATE INDEX IF NOT EXISTS "idx_statement_date" ON "statement_records"("record_date");

-- AddForeignKey
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_violation_category_id_fkey" FOREIGN KEY ("violation_category_id") REFERENCES "violation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
