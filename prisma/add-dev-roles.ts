/**
 * Data migration script — เพิ่ม/อัปเดต teacher+user สำหรับทดสอบแต่ละ role
 * รันครั้งเดียวบน DB ที่มีข้อมูลอยู่แล้ว (idempotent — upsert ทั้งหมด)
 *
 * Usage:  npx tsx prisma/add-dev-roles.ts
 */

import { expand } from "dotenv-expand";
import { config } from "dotenv";
expand(config({ path: ".env.local", override: false }));
expand(config({ path: ".env", override: false }));

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashPassword } from "../lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function makeSig(path: string, color = "#1a1a1a"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="70" viewBox="0 0 240 70">
    <path d="${path}" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function main() {
  console.log("🔧 add-dev-roles: updating teachers & adding grade-head users...\n");

  // ── 1. อัปเดต roles & gradeHeadLevel ของ teachers ที่มีอยู่ ──────────────

  const updates: [string, object][] = [
    ["สมชาย", { gradeHeadLevel: "M1" }],
    ["วิภา",   { gradeHeadLevel: "M2" }],
    ["มาลี",   { gradeHeadLevel: "M3" }],
    ["อนันต์", { role: "DISCIPLINE" }],
    ["สุดา",   { role: "DISCIPLINE" }],
  ];

  for (const [firstName, data] of updates) {
    const { count } = await prisma.teacher.updateMany({ where: { firstName }, data })
    console.log(`  ✓ ${firstName} →`, data, `(${count} row)`);
  }

  // ── 2. ดึง TeacherTitle IDs ───────────────────────────────────────────────

  const ttMap = Object.fromEntries(
    (await prisma.teacherTitle.findMany()).map((r) => [r.name, r.id])
  );

  const schoolAddr = {
    addressSubDistrict: "บางพลีใหญ่",
    addressDistrict: "บางพลี",
    addressProvince: "สมุทรปราการ",
    addressPostalCode: "10540",
  };

  // ── 3. เพิ่ม grade heads ม.4–ม.6 ─────────────────────────────────────────

  const newTeachers = [
    {
      titleId: ttMap["นางสาว"],
      firstName: "พิมพ์ใจ",
      lastName: "สมบูรณ์",
      phone: "0810000004",
      addressHouseNo: "14",
      addressMoo: "2",
      role: "TEACHER" as const,
      gradeHeadLevel: "M4" as const,
      signatureUrl: makeSig(
        "M15,50 C28,25 48,60 68,40 C82,28 96,55 115,44 C130,36 145,52 165,44 C178,38 192,52 215,44"
      ),
      username: "pimjai",
      password: "pimjai123",
    },
    {
      titleId: ttMap["นาย"],
      firstName: "วิชัย",
      lastName: "ก้าวหน้า",
      phone: "0810000005",
      addressHouseNo: "25",
      addressMoo: "3",
      role: "TEACHER" as const,
      gradeHeadLevel: "M5" as const,
      signatureUrl: makeSig(
        "M20,50 C30,22 50,58 70,38 L82,26 L96,50 C110,30 128,56 148,44 C162,36 178,52 205,44"
      ),
      username: "wichai",
      password: "wichai123",
    },
    {
      titleId: ttMap["นาง"],
      firstName: "สมหมาย",
      lastName: "ดีใจ",
      phone: "0810000006",
      addressHouseNo: "36",
      addressMoo: "4",
      role: "TEACHER" as const,
      gradeHeadLevel: "M6" as const,
      signatureUrl: makeSig(
        "M15,48 C25,20 45,58 65,38 C80,26 96,52 115,42 C130,34 145,52 165,42 L200,38 M50,38 L54,56"
      ),
      username: "sommai",
      password: "sommai123",
    },
  ];

  for (const t of newTeachers) {
    const { username, password, ...teacherData } = t;

    // upsert teacher (ถ้ามีแล้วจะไม่ error)
    const existing = await prisma.teacher.findFirst({
      where: { firstName: teacherData.firstName, lastName: teacherData.lastName },
    });

    let teacherId: number;
    if (existing) {
      await prisma.teacher.update({ where: { id: existing.id }, data: teacherData });
      teacherId = existing.id;
      console.log(`  ✓ Teacher "${teacherData.firstName}" updated`);
    } else {
      const created = await prisma.teacher.create({
        data: { ...schoolAddr, ...teacherData },
      });
      teacherId = created.id;
      console.log(`  ✓ Teacher "${teacherData.firstName}" created (id=${teacherId})`);
    }

    // upsert user
    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        passwordHash: hashPassword(password),
        teacherId,
      },
    });
    console.log(`    → user: ${username} / ${password}`);
  }

  console.log("\n✅ add-dev-roles complete!");
  console.log("\n📋 Dev accounts:");
  console.log("  ผอ           prasert  / prasert123");
  console.log("  รองผอ        suree    / suree123");
  console.log("  ครูปกครอง   anan     / anan123   (DISCIPLINE)");
  console.log("  หน.ม.1      somchai  / somchai123");
  console.log("  หน.ม.2      wipa     / wipa123");
  console.log("  หน.ม.3      malee    / malee123");
  console.log("  หน.ม.4      pimjai   / pimjai123  ← ใหม่");
  console.log("  หน.ม.5      wichai   / wichai123  ← ใหม่");
  console.log("  หน.ม.6      sommai   / sommai123  ← ใหม่");
  console.log("  Admin        thanakorn/ thanakorn123");
  console.log("  Super Admin  admin    / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
