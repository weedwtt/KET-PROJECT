-- AlterTable
ALTER TABLE "statement_records" ADD COLUMN     "advisor1_name" VARCHAR(200),
ADD COLUMN     "advisor2_name" VARCHAR(200),
ALTER COLUMN "recorded_by" DROP NOT NULL,
ALTER COLUMN "recorded_by" SET DATA TYPE VARCHAR(200);
