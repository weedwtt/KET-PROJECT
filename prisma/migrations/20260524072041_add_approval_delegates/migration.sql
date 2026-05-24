-- CreateTable
CREATE TABLE "approval_delegates" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "principal_id" INTEGER NOT NULL,
    "delegate_id" INTEGER NOT NULL,

    CONSTRAINT "approval_delegates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "approval_delegates_principal_id_delegate_id_key" ON "approval_delegates"("principal_id", "delegate_id");

-- AddForeignKey
ALTER TABLE "approval_delegates" ADD CONSTRAINT "approval_delegates_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_delegates" ADD CONSTRAINT "approval_delegates_delegate_id_fkey" FOREIGN KEY ("delegate_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
