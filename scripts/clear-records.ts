/**
 * สคริปต์ลบบันทึกถ้อยคำนักเรียนและบันทึกทัณฑ์บนทั้งหมด
 *
 * รันด้วย:
 *   npx tsx scripts/clear-records.ts
 *
 * ⚠️  ข้อมูลที่ลบจะไม่สามารถกู้คืนได้ — ตรวจสอบให้แน่ใจก่อนรัน
 */

import { expand } from "dotenv-expand"
import { config } from "dotenv"
expand(config({ path: ".env.local", override: false }))
expand(config({ path: ".env", override: false }))

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // นับก่อนลบ
  const statementCount = await prisma.statementRecord.count()
  const bondCount = await prisma.bondRecord.count()

  console.log("╔══════════════════════════════════════════╗")
  console.log("║       clear-records — ลบรายการทั้งหมด    ║")
  console.log("╚══════════════════════════════════════════╝")
  console.log(`  บันทึกถ้อยคำ : ${statementCount} รายการ`)
  console.log(`  บันทึกทัณฑ์บน: ${bondCount} รายการ`)
  console.log("")

  if (statementCount === 0 && bondCount === 0) {
    console.log("✓ ไม่มีข้อมูลให้ลบ")
    return
  }

  // ยืนยันก่อนลบ (ตรวจ argument --confirm)
  const confirmed = process.argv.includes("--confirm")
  if (!confirmed) {
    console.log("⚠️  หากต้องการลบจริง ให้รันพร้อม flag --confirm:")
    console.log("   npx tsx scripts/clear-records.ts --confirm")
    console.log("")
    console.log("   (สคริปต์นี้จะลบข้อมูลถาวร ไม่สามารถกู้คืนได้)")
    return
  }

  console.log("กำลังลบ...")

  // StatementBond ถูก cascade delete อัตโนมัติเมื่อลบ StatementRecord
  const deletedStatements = await prisma.statementRecord.deleteMany()
  console.log(`  ✓ ลบบันทึกถ้อยคำ ${deletedStatements.count} รายการ`)

  const deletedBonds = await prisma.bondRecord.deleteMany()
  console.log(`  ✓ ลบบันทึกทัณฑ์บน ${deletedBonds.count} รายการ`)

  console.log("")
  console.log("✓ เสร็จสิ้น")
}

main()
  .catch((e) => {
    console.error("เกิดข้อผิดพลาด:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
