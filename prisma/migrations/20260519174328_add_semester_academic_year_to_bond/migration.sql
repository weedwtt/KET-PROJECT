-- AlterTable
ALTER TABLE "bond_records" ADD COLUMN     "academic_year_id" INTEGER,
ADD COLUMN     "semester_id" INTEGER;

-- AddForeignKey
ALTER TABLE "bond_records" ADD CONSTRAINT "bond_records_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bond_records" ADD CONSTRAINT "bond_records_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;
