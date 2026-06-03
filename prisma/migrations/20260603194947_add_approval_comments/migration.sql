-- AlterTable
ALTER TABLE "bond_records" ADD COLUMN     "director_comment" TEXT,
ADD COLUMN     "vice_director_comment" TEXT;

-- AlterTable
ALTER TABLE "statement_records" ADD COLUMN     "director_comment" TEXT,
ADD COLUMN     "vice_director_comment" TEXT;
