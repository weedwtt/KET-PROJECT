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

-- CreateIndex
CREATE UNIQUE INDEX "teacher_titles_name_key" ON "teacher_titles"("name");

-- CreateIndex
CREATE INDEX "idx_teacher_name" ON "teachers"("first_name", "last_name");

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "teacher_titles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
