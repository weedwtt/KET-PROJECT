-- CreateEnum: TeacherRole
CREATE TYPE "TeacherRole" AS ENUM ('ผอ', 'รองผอ', 'ครู', 'admin');

-- CreateEnum: GradeHeadLevel
CREATE TYPE "GradeHeadLevel" AS ENUM ('ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6');

-- AlterColumn: teachers.role  VARCHAR(50) → TeacherRole enum
-- Nullify any values that don't match valid enum entries before casting
UPDATE "teachers" SET "role" = NULL
  WHERE "role" IS NOT NULL
    AND "role" NOT IN ('ผอ', 'รองผอ', 'ครู', 'admin');

ALTER TABLE "teachers"
  ALTER COLUMN "role" TYPE "TeacherRole"
  USING "role"::"TeacherRole";

-- AddColumn: teachers.grade_head_level
ALTER TABLE "teachers" ADD COLUMN "grade_head_level" "GradeHeadLevel";

-- AlterColumn: teachers.signature_url  VARCHAR(500) → TEXT
ALTER TABLE "teachers"
  ALTER COLUMN "signature_url" TYPE TEXT;
