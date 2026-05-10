-- CreateTable
CREATE TABLE "titles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardian_relations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "guardian_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "student_code" VARCHAR(20) NOT NULL,
    "class_number" INTEGER NOT NULL,
    "grade_level" VARCHAR(10) NOT NULL,
    "class_room" INTEGER NOT NULL,
    "title_id" INTEGER NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "birth_date" DATE NOT NULL,
    "national_id" CHAR(13) NOT NULL,
    "phone" VARCHAR(20),
    "nationality" VARCHAR(50) NOT NULL,
    "ethnicity" VARCHAR(50) NOT NULL,
    "religion" VARCHAR(50) NOT NULL,
    "blood_type" VARCHAR(5),
    "address_house_no" VARCHAR(20) NOT NULL,
    "address_moo" VARCHAR(10),
    "address_village" VARCHAR(100),
    "address_road" VARCHAR(100),
    "address_soi" VARCHAR(100),
    "address_sub_district" VARCHAR(100) NOT NULL,
    "address_district" VARCHAR(100) NOT NULL,
    "address_province" VARCHAR(100) NOT NULL,
    "address_postal_code" CHAR(5) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_titles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "teacher_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title_id" INTEGER NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "address_house_no" VARCHAR(20) NOT NULL,
    "address_moo" VARCHAR(10),
    "address_village" VARCHAR(100),
    "address_road" VARCHAR(100),
    "address_soi" VARCHAR(100),
    "address_sub_district" VARCHAR(100) NOT NULL,
    "address_district" VARCHAR(100) NOT NULL,
    "address_province" VARCHAR(100) NOT NULL,
    "address_postal_code" CHAR(5) NOT NULL,
    "signature_url" VARCHAR(500),
    "signature_updated_at" TIMESTAMP(3),

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "student_id" INTEGER NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "relation_id" INTEGER NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "semesters" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violation_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,

    CONSTRAINT "violation_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
CREATE UNIQUE INDEX "titles_name_key" ON "titles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "guardian_relations_name_key" ON "guardian_relations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_code_key" ON "students"("student_code");

-- CreateIndex
CREATE UNIQUE INDEX "students_national_id_key" ON "students"("national_id");

-- CreateIndex
CREATE INDEX "idx_student_name" ON "students"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "idx_student_first_name" ON "students"("first_name");

-- CreateIndex
CREATE INDEX "idx_student_last_name" ON "students"("last_name");

-- CreateIndex
CREATE INDEX "idx_student_class" ON "students"("grade_level", "class_room");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_titles_name_key" ON "teacher_titles"("name");

-- CreateIndex
CREATE INDEX "idx_teacher_name" ON "teachers"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "idx_guardian_student" ON "guardians"("student_id");

-- CreateIndex
CREATE INDEX "idx_advisor_teacher" ON "student_advisors"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_student_advisor_slot" ON "student_advisors"("student_id", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_name_key" ON "semesters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_value_key" ON "semesters"("value");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_year_key" ON "academic_years"("year");

-- CreateIndex
CREATE UNIQUE INDEX "violation_categories_name_key" ON "violation_categories"("name");

-- CreateIndex
CREATE INDEX "idx_statement_student" ON "statement_records"("student_id");

-- CreateIndex
CREATE INDEX "idx_statement_date" ON "statement_records"("record_date");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "teacher_titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_relation_id_fkey" FOREIGN KEY ("relation_id") REFERENCES "guardian_relations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_advisors" ADD CONSTRAINT "student_advisors_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_advisors" ADD CONSTRAINT "student_advisors_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_records" ADD CONSTRAINT "statement_records_violation_category_id_fkey" FOREIGN KEY ("violation_category_id") REFERENCES "violation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
