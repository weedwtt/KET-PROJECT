-- AlterTable
ALTER TABLE "statement_records" ADD COLUMN     "violation_sub_category_id" INTEGER;

-- CreateTable
CREATE TABLE "violation_sub_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "violation_category_id" INTEGER NOT NULL,

    CONSTRAINT "violation_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_sub_category_parent" ON "violation_sub_categories"("violation_category_id");

-- AddForeignKey
ALTER TABLE "violation_sub_categories" ADD CONSTRAINT "violation_sub_categories_violation_category_id_fkey" FOREIGN KEY ("violation_category_id") REFERENCES "violation_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_violation_sub_category_id_fkey" FOREIGN KEY ("violation_sub_category_id") REFERENCES "violation_sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
