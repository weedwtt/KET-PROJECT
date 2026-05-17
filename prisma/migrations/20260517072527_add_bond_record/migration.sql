-- CreateTable
CREATE TABLE "bond_records" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "student_id" INTEGER NOT NULL,
    "contract_date" TIMESTAMP(3) NOT NULL,
    "guardian_id" INTEGER,
    "guardian_name" VARCHAR(200) NOT NULL,
    "guardian_relation" VARCHAR(100) NOT NULL,
    "guardian_phone" VARCHAR(30),
    "address_house_no" VARCHAR(20),
    "address_moo" VARCHAR(10),
    "address_village" VARCHAR(100),
    "address_road" VARCHAR(100),
    "address_soi" VARCHAR(100),
    "address_sub_district" VARCHAR(100),
    "address_district" VARCHAR(100),
    "address_province" VARCHAR(100),
    "violation_detail" TEXT NOT NULL,
    "measure_deduct_score" BOOLEAN NOT NULL DEFAULT false,
    "measure_deduct_points" INTEGER,
    "measure_activity" BOOLEAN NOT NULL DEFAULT false,
    "measure_suspension" BOOLEAN NOT NULL DEFAULT false,
    "measure_transfer" BOOLEAN NOT NULL DEFAULT false,
    "recorder" VARCHAR(200) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "guardian_signature" TEXT,
    "student_signature" TEXT,
    "advisor_signature" TEXT,
    "head_teacher_id" INTEGER,
    "discipline_teacher_id" INTEGER,
    "vice_director_signature" TEXT,
    "director_signature" TEXT,

    CONSTRAINT "bond_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_bond_student" ON "bond_records"("student_id");

-- CreateIndex
CREATE INDEX "idx_bond_date" ON "bond_records"("contract_date");

-- AddForeignKey
ALTER TABLE "bond_records" ADD CONSTRAINT "bond_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bond_records" ADD CONSTRAINT "bond_records_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bond_records" ADD CONSTRAINT "bond_records_head_teacher_id_fkey" FOREIGN KEY ("head_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bond_records" ADD CONSTRAINT "bond_records_discipline_teacher_id_fkey" FOREIGN KEY ("discipline_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
