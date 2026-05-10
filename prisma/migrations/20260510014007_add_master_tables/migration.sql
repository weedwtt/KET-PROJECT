/*
  Warnings:

  - Added the required column `subject` to the `statement_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "statement_records" ADD COLUMN     "incident_at" TIMESTAMP(3),
ADD COLUMN     "location" VARCHAR(200),
ADD COLUMN     "subject" VARCHAR(500) NOT NULL;
