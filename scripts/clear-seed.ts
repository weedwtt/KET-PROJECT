/**
 * สคริปต์ลบข้อมูล user / ครู / นักเรียน ที่มาจาก seed ทั้งหมด
 * ยกเว้น user "admin" (super admin ที่ไม่ผูกกับครู)
 *
 * รันด้วย:
 *   npx tsx scripts/clear-seed.ts             ← ดูจำนวนก่อน (ไม่ลบ)
 *   npx tsx scripts/clear-seed.ts --confirm   ← ลบจริง
 *
 * ⚠️  ควรรัน clear-records ก่อน หากยังมีบันทึกถ้อยคำ / ทัณฑ์บนที่อ้างอิงครู seed อยู่
 */

import { expand } from "dotenv-expand"
import { config } from "dotenv"
expand(config({ path: ".env.local", override: false }))
expand(config({ path: ".env", override: false }))

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ── รายชื่อที่มาจาก seed ──────────────────────────────────────────────────────

const SEED_USERNAMES = [
  "prasert", "suree", "somchai", "wipa", "malee",
  "anan", "suda", "chanchai", "thanakorn",
]

const SEED_STUDENT_CODES = [
  "67110001", "67110002", "67110003", "67110004", "67110005",
  "67120001", "67120002", "67120003", "67120004", "67120005",
  "67210001", "67210002", "67210003", "67210004", "67210005",
  "67220001", "67220002", "67220003", "67220004", "67220005",
  "67310001", "67310002", "67310003", "67310004", "67310005",
  "67320001", "67320002", "67320003", "67320004", "67320005",
]

const SEED_TEACHERS: { firstName: string; lastName: string }[] = [
  { firstName: "ประเสริฐ", lastName: "วิทยาคม" },
  { firstName: "สุรีย์",   lastName: "มีสุข"     },
  { firstName: "สมชาย",   lastName: "ใจดี"       },
  { firstName: "วิภา",    lastName: "รักเรียน"   },
  { firstName: "มาลี",    lastName: "ดอกไม้"     },
  { firstName: "อนันต์",  lastName: "สุขสวัสดิ์" },
  { firstName: "สุดา",    lastName: "รุ่งเรือง"  },
  { firstName: "ชาญชัย",  lastName: "กล้าหาญ"   },
  { firstName: "ธนกร",    lastName: "ระบบดี"     },
]

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  // หา seed teachers ในฐานข้อมูล
  const seedTeachers = await prisma.teacher.findMany({
    where: {
      OR: SEED_TEACHERS.map(({ firstName, lastName }) => ({ firstName, lastName })),
    },
    select: { id: true, firstName: true, lastName: true },
  })
  const seedTeacherIds = seedTeachers.map((t) => t.id)

  // นับ
  const userCount    = await prisma.user.count({ where: { username: { in: SEED_USERNAMES } } })
  const studentCount = await prisma.student.count({ where: { studentCode: { in: SEED_STUDENT_CODES } } })
  const delegateCount = seedTeacherIds.length > 0
    ? await prisma.approvalDelegate.count({
        where: { OR: [{ principalId: { in: seedTeacherIds } }, { delegateId: { in: seedTeacherIds } }] },
      })
    : 0

  console.log("╔══════════════════════════════════════════╗")
  console.log("║    clear-seed — ลบข้อมูลจาก seed        ║")
  console.log("╚══════════════════════════════════════════╝")
  console.log(`  user (ยกเว้น admin)  : ${userCount} รายการ`)
  console.log(`  ครู                  : ${seedTeachers.length} รายการ`)
  console.log(`  นักเรียน             : ${studentCount} รายการ`)
  console.log(`  approval delegates   : ${delegateCount} รายการ`)
  console.log("")
  console.log("  (Guardian, StudentAdvisor จะถูกลบ cascade ตามนักเรียน)")
  console.log("")

  if (userCount === 0 && seedTeachers.length === 0 && studentCount === 0) {
    console.log("✓ ไม่พบข้อมูล seed — ไม่มีอะไรต้องลบ")
    return
  }

  const confirmed = process.argv.includes("--confirm")
  if (!confirmed) {
    console.log("⚠️  หากต้องการลบจริง ให้รันพร้อม flag --confirm:")
    console.log("   npx tsx scripts/clear-seed.ts --confirm")
    console.log("")
    console.log("   หากยังมีบันทึกถ้อยคำ/ทัณฑ์บนที่อ้างอิงครู seed ให้รันก่อน:")
    console.log("   npx tsx scripts/clear-records.ts --confirm")
    return
  }

  console.log("กำลังลบ...")

  // 1. ลบ Users (seed, ยกเว้น admin)
  const du = await prisma.user.deleteMany({ where: { username: { in: SEED_USERNAMES } } })
  console.log(`  ✓ ลบ user ${du.count} รายการ`)

  // 2. ลบ Students (cascade: Guardian, StudentAdvisor)
  const ds = await prisma.student.deleteMany({ where: { studentCode: { in: SEED_STUDENT_CODES } } })
  console.log(`  ✓ ลบนักเรียน ${ds.count} รายการ (cascade: ผู้ปกครอง, ครูที่ปรึกษา)`)

  // 3. ลบ ApprovalDelegate ที่อ้างอิง seed teachers (ก่อนลบ teacher)
  if (seedTeacherIds.length > 0) {
    const dd = await prisma.approvalDelegate.deleteMany({
      where: { OR: [{ principalId: { in: seedTeacherIds } }, { delegateId: { in: seedTeacherIds } }] },
    })
    if (dd.count > 0) console.log(`  ✓ ลบ approval delegates ${dd.count} รายการ`)
  }

  // 4. ลบ Teachers (seed)
  if (seedTeacherIds.length > 0) {
    const dt = await prisma.teacher.deleteMany({ where: { id: { in: seedTeacherIds } } })
    console.log(`  ✓ ลบครู ${dt.count} รายการ`)
  } else {
    console.log("  — ไม่พบครูจาก seed ในฐานข้อมูล")
  }

  console.log("")
  console.log("✓ เสร็จสิ้น")
}

main()
  .catch((e) => {
    console.error("เกิดข้อผิดพลาด:", e.message ?? e)
    console.error("")
    console.error("hint: หากมีบันทึกถ้อยคำ/ทัณฑ์บนที่อ้างอิงครู seed ให้รันก่อน:")
    console.error("  npx tsx scripts/clear-records.ts --confirm")
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
