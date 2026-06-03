/**
 * สคริปต์สร้าง teacher record ให้ user ที่ยังไม่มี (teacherId = null)
 * เช่น super admin — เพื่อให้สามารถเลือกเป็น "ผู้รับมอบอำนาจอนุมัติแทน" ได้
 * (ApprovalDelegate ผูกกับ Teacher.id จึงต้องมี teacher record ก่อน)
 *
 * teacher ที่สร้างจะตั้ง role = ADMIN และใช้ค่า placeholder สำหรับฟิลด์บังคับ
 * (สามารถแก้ไขชื่อ/ที่อยู่ภายหลังได้ที่หน้าแก้ไขผู้ใช้)
 *
 * รันด้วย:
 *   npx tsx scripts/backfill-admin-teacher.ts             ← ดูจำนวนก่อน (ไม่แก้)
 *   npx tsx scripts/backfill-admin-teacher.ts --confirm   ← สร้างจริง
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
  const usersWithoutTeacher = await prisma.user.findMany({
    where: { teacherId: null },
    select: { id: true, username: true },
  })

  console.log("╔══════════════════════════════════════════╗")
  console.log("║  backfill-admin-teacher                   ║")
  console.log("╚══════════════════════════════════════════╝")
  console.log(`  user ที่ยังไม่มี teacher record : ${usersWithoutTeacher.length} รายการ`)
  usersWithoutTeacher.forEach((u) => console.log(`    • ${u.username} (id=${u.id})`))
  console.log("")

  if (usersWithoutTeacher.length === 0) {
    console.log("✓ ไม่พบ user ที่ต้องสร้าง teacher — ไม่มีอะไรต้องทำ")
    return
  }

  const confirmed = process.argv.includes("--confirm")
  if (!confirmed) {
    console.log("⚠️  หากต้องการสร้างจริง ให้รันพร้อม flag --confirm:")
    console.log("   npx tsx scripts/backfill-admin-teacher.ts --confirm")
    return
  }

  // ใช้ teacher title แรกที่มีในระบบเป็นค่าเริ่มต้น
  const defaultTitle = await prisma.teacherTitle.findFirst({ orderBy: { id: "asc" } })
  if (!defaultTitle) {
    throw new Error("ไม่พบ TeacherTitle ในระบบ — กรุณา seed master data ก่อน")
  }

  console.log("กำลังสร้าง teacher record...")
  for (const u of usersWithoutTeacher) {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        teacher: {
          create: {
            titleId: defaultTitle.id,
            firstName: u.username,
            lastName: "(ผู้ดูแลระบบ)",
            phone: "-",
            role: "ADMIN",
            addressHouseNo: "-",
            addressSubDistrict: "-",
            addressDistrict: "-",
            addressProvince: "-",
            addressPostalCode: "00000",
          },
        },
      },
    })
    console.log(`  ✓ สร้าง teacher ให้ ${u.username}`)
  }

  console.log("")
  console.log("✓ เสร็จสิ้น — แก้ไขชื่อ/ที่อยู่ได้ที่หน้าแก้ไขผู้ใช้")
}

main()
  .catch((e) => {
    console.error("เกิดข้อผิดพลาด:", e.message ?? e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
