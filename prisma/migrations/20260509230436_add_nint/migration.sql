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
CREATE INDEX "idx_guardian_student" ON "guardians"("student_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_relation_id_fkey" FOREIGN KEY ("relation_id") REFERENCES "guardian_relations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
