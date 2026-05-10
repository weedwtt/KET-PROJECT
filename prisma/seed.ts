import { expand } from "dotenv-expand";
import { config } from "dotenv";
expand(config({ path: ".env.local", override: false }));
expand(config({ path: ".env", override: false }));

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashPassword } from "../lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Signature helper ──────────────────────────────────────────────────────────
// สร้าง SVG signature data URL สำหรับ seed (ใช้แทนไฟล์จริง)
function makeSigDataUrl(path: string, color = "#1a1a1a"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="70" viewBox="0 0 240 70">
    <path d="${path}" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const SIGNATURES: Record<string, string> = {
  // ผอ.ประเสริฐ — ลายเซ็นใหญ่มีวง
  prasert: makeSigDataUrl(
    "M20,50 C35,15 60,55 85,35 C100,22 115,48 130,38 C148,26 162,50 180,40 C190,34 200,42 215,38 M80,38 C85,55 90,58 95,55"
  ),
  // รอง ผอ.สุรีย์ — เส้นโค้งต่อเนื่อง
  suree: makeSigDataUrl(
    "M15,55 C30,20 50,60 70,40 C85,28 100,52 120,42 C140,32 158,50 175,42 L200,38 M60,42 L65,58 M115,42 L118,56"
  ),
  // หน.ระดับ ม.1 สมชาย — มุมแหลม
  somchai: makeSigDataUrl(
    "M15,55 L40,20 L55,55 L70,25 L85,55 L100,30 C115,18 130,48 150,38 C165,30 178,50 200,42"
  ),
  // หน.ระดับ ม.2 วิภา — โค้งสวยงาม
  wipa: makeSigDataUrl(
    "M15,45 C25,20 45,60 65,40 C80,28 95,55 115,45 C130,37 145,55 165,45 C178,38 192,50 215,44 M45,40 C47,52 52,56 58,52"
  ),
  // หน.ระดับ ม.3 มาลี — กะทัดรัด
  malee: makeSigDataUrl(
    "M20,50 C30,25 50,55 68,40 L80,28 L92,50 C105,30 120,55 138,44 C150,36 165,50 185,44"
  ),
  // ครูฝ่ายปกครอง อนันต์ — เส้นหนา bold
  anan: makeSigDataUrl(
    "M10,50 C25,15 55,60 80,35 C100,18 120,55 145,38 C160,28 178,52 205,42 M50,35 L55,58 M120,38 L125,58",
    "#111111"
  ),
  // ครูฝ่ายปกครอง สุดา — เส้นละเอียด
  suda: makeSigDataUrl(
    "M15,48 C28,22 48,58 68,42 C82,32 96,52 115,44 C128,38 142,52 162,44 C175,38 190,50 210,44 M68,42 C70,54 74,58 78,55"
  ),
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 0. Master: Title, GuardianRelation, TeacherTitle ──────────────────────

  await prisma.title.createMany({
    data: [
      { name: "เด็กชาย" },
      { name: "เด็กหญิง" },
      { name: "นาย" },
      { name: "นาง" },
      { name: "นางสาว" },
    ],
    skipDuplicates: true,
  });

  await prisma.guardianRelation.createMany({
    data: [
      { name: "พ่อ" },
      { name: "แม่" },
      { name: "ปู่" },
      { name: "ย่า" },
      { name: "ตา" },
      { name: "ยาย" },
      { name: "พี่" },
      { name: "อื่นๆ" },
    ],
    skipDuplicates: true,
  });

  await prisma.teacherTitle.createMany({
    data: [
      { name: "นาย" },
      { name: "นาง" },
      { name: "นางสาว" },
      { name: "ดร." },
      { name: "ผศ.ดร." },
    ],
    skipDuplicates: true,
  });

  console.log("✓ Title / GuardianRelation / TeacherTitle");

  // ── 1. Discipline master ───────────────────────────────────────────────────

  await prisma.semester.createMany({
    data: [
      { name: "ภาคเรียนที่ 1", value: 1 },
      { name: "ภาคเรียนที่ 2", value: 2 },
    ],
    skipDuplicates: true,
  });

  const currentBE = new Date().getFullYear() + 543;
  await prisma.academicYear.createMany({
    data: Array.from({ length: 8 }, (_, i) => ({ year: currentBE - i })),
    skipDuplicates: true,
  });

  await prisma.violationCategory.createMany({
    data: [
      { name: "หมวดที่ 1 ความประพฤติและมารยาท" },
      { name: "หมวดที่ 2 การแต่งกายและการไว้ทรงผม" },
      { name: "หมวดที่ 3 ความรับผิดชอบในการเรียน" },
      { name: "หมวดที่ 4 การใช้สิ่งเสพติดและอบายมุข" },
      { name: "หมวดที่ 5 ทรัพย์สินและความสะอาด" },
      { name: "หมวดที่ 6 ความปลอดภัยและการทะเลาะวิวาท" },
      { name: "หมวดที่ 7 อื่น ๆ" },
    ],
    skipDuplicates: true,
  });

  console.log("✓ Semester / AcademicYear / ViolationCategory");

  // ── 2. Resolve ID maps ────────────────────────────────────────────────────

  const titleMap = Object.fromEntries(
    (await prisma.title.findMany()).map((r) => [r.name, r.id])
  );
  const relationMap = Object.fromEntries(
    (await prisma.guardianRelation.findMany()).map((r) => [r.name, r.id])
  );
  const ttMap = Object.fromEntries(
    (await prisma.teacherTitle.findMany()).map((r) => [r.name, r.id])
  );

  // ── 3. Teachers ───────────────────────────────────────────────────────────
  //
  //  Index  ชื่อ               role                    signatureUrl
  //  [0]    ดร.ประเสริฐ        null (ผอ.)              ✓
  //  [1]    นาง สุรีย์         null (รอง ผอ.)          ✓
  //  [2]    นาย สมชาย          หัวหน้าระดับชั้น (ม.1)  ✓
  //  [3]    นาง วิภา           หัวหน้าระดับชั้น (ม.2)  ✓
  //  [4]    นางสาว มาลี        หัวหน้าระดับชั้น (ม.3)  ✓
  //  [5]    นาย อนันต์         ครูฝ่ายปกครอง           ✓
  //  [6]    นางสาว สุดา        ครูฝ่ายปกครอง           ✓
  //  [7]    นาย ชาญชัย         null (ครูทั่วไป)        null (ยังไม่อัปโหลด)

  const schoolAddr = {
    addressSubDistrict: "บางพลีใหญ่",
    addressDistrict: "บางพลี",
    addressProvince: "สมุทรปราการ",
    addressPostalCode: "10540",
  };

  const teachersRaw = [
    {
      titleId: ttMap["ดร."],
      firstName: "ประเสริฐ",
      lastName: "วิทยาคม",
      phone: "0891111111",
      addressHouseNo: "99",
      addressMoo: "3",
      role: null,
      signatureUrl: SIGNATURES.prasert,
    },
    {
      titleId: ttMap["นาง"],
      firstName: "สุรีย์",
      lastName: "มีสุข",
      phone: "0892222222",
      addressHouseNo: "55",
      addressMoo: "1",
      addressSubDistrict: "บางโฉลง",
      role: null,
      signatureUrl: SIGNATURES.suree,
    },
    // หัวหน้าระดับชั้น
    {
      titleId: ttMap["นาย"],
      firstName: "สมชาย",
      lastName: "ใจดี",
      phone: "0893333333",
      addressHouseNo: "12/3",
      addressMoo: "5",
      role: "หัวหน้าระดับชั้น",
      signatureUrl: SIGNATURES.somchai,
    },
    {
      titleId: ttMap["นาง"],
      firstName: "วิภา",
      lastName: "รักเรียน",
      phone: "0894444444",
      addressHouseNo: "78",
      addressMoo: "2",
      addressSubDistrict: "ราชาเทวะ",
      role: "หัวหน้าระดับชั้น",
      signatureUrl: SIGNATURES.wipa,
    },
    {
      titleId: ttMap["นางสาว"],
      firstName: "มาลี",
      lastName: "ดอกไม้",
      phone: "0895555555",
      addressHouseNo: "34",
      addressMoo: "4",
      addressSubDistrict: "หนองปรือ",
      role: "หัวหน้าระดับชั้น",
      signatureUrl: SIGNATURES.malee,
    },
    // ครูฝ่ายปกครอง
    {
      titleId: ttMap["นาย"],
      firstName: "อนันต์",
      lastName: "สุขสวัสดิ์",
      phone: "0896666666",
      addressHouseNo: "101",
      addressMoo: "6",
      role: "ครูฝ่ายปกครอง",
      signatureUrl: SIGNATURES.anan,
    },
    {
      titleId: ttMap["นางสาว"],
      firstName: "สุดา",
      lastName: "รุ่งเรือง",
      phone: "0897777777",
      addressHouseNo: "22",
      addressMoo: "3",
      role: "ครูฝ่ายปกครอง",
      signatureUrl: SIGNATURES.suda,
    },
    // ครูทั่วไป (ไม่มีลายเซ็น — ตัวอย่าง null)
    {
      titleId: ttMap["นาย"],
      firstName: "ชาญชัย",
      lastName: "กล้าหาญ",
      phone: "0898888888",
      addressHouseNo: "67",
      addressMoo: "7",
      role: null,
      signatureUrl: null,
    },
  ];

  await prisma.teacher.createMany({
    data: teachersRaw.map((t) => ({
      ...schoolAddr,
      ...t,
    })),
    skipDuplicates: true,
  });
  console.log(`✓ Teachers (${teachersRaw.length}) — roles & signatures seeded`);

  // ── 4. Students ───────────────────────────────────────────────────────────

  const dc = titleMap["เด็กชาย"];
  const dy = titleMap["เด็กหญิง"];
  const por = relationMap["พ่อ"];
  const mae = relationMap["แม่"];
  const ta  = relationMap["ตา"];
  const yai = relationMap["ยาย"];

  const localAddr = {
    nationality: "ไทย",
    ethnicity: "ไทย",
    religion: "พุทธ",
    addressSubDistrict: "บางพลีใหญ่",
    addressDistrict: "บางพลี",
    addressProvince: "สมุทรปราการ",
    addressPostalCode: "10540",
  };

  type G = { firstName: string; lastName: string; phone: string; relationId: number };
  type S = {
    studentCode: string; classNumber: number; gradeLevel: string; classRoom: number;
    titleId: number; firstName: string; lastName: string;
    birthDate: Date; nationalId: string; phone?: string; bloodType?: string;
    addressHouseNo: string; addressMoo?: string;
    guardians: G[];
  };

  const students: S[] = [
    // ─── ม.1/1 ──────────────────────────────────────────────────────────────
    {
      studentCode: "67110001", classNumber: 1, gradeLevel: "ม.1", classRoom: 1,
      titleId: dc, firstName: "กิตติ", lastName: "ศรีสุวรรณ",
      birthDate: new Date("2013-03-15"), nationalId: "1640000000001",
      bloodType: "O", addressHouseNo: "10", addressMoo: "1",
      guardians: [
        { firstName: "สมศักดิ์", lastName: "ศรีสุวรรณ", phone: "0811110001", relationId: por },
        { firstName: "วรรณา",   lastName: "ศรีสุวรรณ", phone: "0811110002", relationId: mae },
      ],
    },
    {
      studentCode: "67110002", classNumber: 2, gradeLevel: "ม.1", classRoom: 1,
      titleId: dy, firstName: "ปิยะดา", lastName: "ทองดี",
      birthDate: new Date("2013-06-20"), nationalId: "1640000000002",
      bloodType: "A", addressHouseNo: "23", addressMoo: "2",
      guardians: [
        { firstName: "ประสิทธิ์", lastName: "ทองดี", phone: "0811110003", relationId: por },
        { firstName: "นภา",       lastName: "ทองดี", phone: "0811110004", relationId: mae },
      ],
    },
    {
      studentCode: "67110003", classNumber: 3, gradeLevel: "ม.1", classRoom: 1,
      titleId: dc, firstName: "ธนภัทร", lastName: "วงศ์ไพบูลย์",
      birthDate: new Date("2013-01-08"), nationalId: "1640000000003",
      bloodType: "B", addressHouseNo: "45", addressMoo: "3",
      guardians: [
        { firstName: "ไพบูลย์", lastName: "วงศ์ไพบูลย์", phone: "0811110005", relationId: por },
      ],
    },
    {
      studentCode: "67110004", classNumber: 4, gradeLevel: "ม.1", classRoom: 1,
      titleId: dy, firstName: "อาทิตยา", lastName: "สุขใจ",
      birthDate: new Date("2013-09-25"), nationalId: "1640000000004",
      bloodType: "AB", addressHouseNo: "67", addressMoo: "4",
      guardians: [
        { firstName: "สุทธิชัย", lastName: "สุขใจ", phone: "0811110007", relationId: por },
        { firstName: "รัตนา",    lastName: "สุขใจ", phone: "0811110008", relationId: mae },
      ],
    },
    {
      studentCode: "67110005", classNumber: 5, gradeLevel: "ม.1", classRoom: 1,
      titleId: dc, firstName: "พชร", lastName: "เจริญพร",
      birthDate: new Date("2013-11-30"), nationalId: "1640000000005",
      addressHouseNo: "89", addressMoo: "5",
      guardians: [
        { firstName: "เจริญ",  lastName: "เจริญพร", phone: "0811110009", relationId: por },
        { firstName: "สมปอง", lastName: "เจริญพร", phone: "0811110010", relationId: mae },
      ],
    },

    // ─── ม.1/2 ──────────────────────────────────────────────────────────────
    {
      studentCode: "67120001", classNumber: 1, gradeLevel: "ม.1", classRoom: 2,
      titleId: dc, firstName: "นนทพัทธ์", lastName: "ชัยมงคล",
      birthDate: new Date("2013-04-12"), nationalId: "1640000000006",
      bloodType: "O", addressHouseNo: "11", addressMoo: "1",
      guardians: [
        { firstName: "ชัยณรงค์", lastName: "ชัยมงคล", phone: "0822220001", relationId: por },
        { firstName: "ลัดดา",    lastName: "ชัยมงคล", phone: "0822220002", relationId: mae },
      ],
    },
    {
      studentCode: "67120002", classNumber: 2, gradeLevel: "ม.1", classRoom: 2,
      titleId: dy, firstName: "พิชญา", lastName: "ลำดวน",
      birthDate: new Date("2013-07-18"), nationalId: "1640000000007",
      bloodType: "A", addressHouseNo: "33", addressMoo: "2",
      guardians: [
        { firstName: "วิชัย", lastName: "ลำดวน", phone: "0822220003", relationId: ta  },
        { firstName: "สุภา",  lastName: "ลำดวน", phone: "0822220004", relationId: yai },
      ],
    },
    {
      studentCode: "67120003", classNumber: 3, gradeLevel: "ม.1", classRoom: 2,
      titleId: dc, firstName: "ณัฐพล", lastName: "ระวังภัย",
      birthDate: new Date("2013-02-22"), nationalId: "1640000000008",
      addressHouseNo: "55", addressMoo: "3",
      guardians: [
        { firstName: "ณรงค์", lastName: "ระวังภัย", phone: "0822220005", relationId: por },
        { firstName: "กานดา", lastName: "ระวังภัย", phone: "0822220006", relationId: mae },
      ],
    },
    {
      studentCode: "67120004", classNumber: 4, gradeLevel: "ม.1", classRoom: 2,
      titleId: dy, firstName: "จิดาภา", lastName: "สวัสดิ์",
      birthDate: new Date("2013-10-05"), nationalId: "1640000000009",
      bloodType: "B", addressHouseNo: "77", addressMoo: "4",
      guardians: [
        { firstName: "อภิชัย", lastName: "สวัสดิ์", phone: "0822220007", relationId: por },
        { firstName: "อัมพร",  lastName: "สวัสดิ์", phone: "0822220008", relationId: mae },
      ],
    },
    {
      studentCode: "67120005", classNumber: 5, gradeLevel: "ม.1", classRoom: 2,
      titleId: dc, firstName: "วรากร", lastName: "บัวงาม",
      birthDate: new Date("2013-12-01"), nationalId: "1640000000010",
      addressHouseNo: "99", addressMoo: "5",
      guardians: [
        { firstName: "บุญมี", lastName: "บัวงาม", phone: "0822220009", relationId: por },
      ],
    },

    // ─── ม.2/1 ──────────────────────────────────────────────────────────────
    {
      studentCode: "67210001", classNumber: 1, gradeLevel: "ม.2", classRoom: 1,
      titleId: dc, firstName: "ภูวนาท", lastName: "ดาวเรือง",
      birthDate: new Date("2012-03-10"), nationalId: "1640000000011",
      bloodType: "O", addressHouseNo: "12", addressMoo: "1",
      guardians: [
        { firstName: "ประพันธ์", lastName: "ดาวเรือง", phone: "0833330001", relationId: por },
        { firstName: "อรุณี",    lastName: "ดาวเรือง", phone: "0833330002", relationId: mae },
      ],
    },
    {
      studentCode: "67210002", classNumber: 2, gradeLevel: "ม.2", classRoom: 1,
      titleId: dy, firstName: "ณิชากร", lastName: "พลอยงาม",
      birthDate: new Date("2012-05-28"), nationalId: "1640000000012",
      bloodType: "A", addressHouseNo: "34", addressMoo: "2",
      guardians: [
        { firstName: "สมบัติ", lastName: "พลอยงาม", phone: "0833330003", relationId: por },
        { firstName: "ปราณี",  lastName: "พลอยงาม", phone: "0833330004", relationId: mae },
      ],
    },
    {
      studentCode: "67210003", classNumber: 3, gradeLevel: "ม.2", classRoom: 1,
      titleId: dc, firstName: "กวิน", lastName: "หาญกล้า",
      birthDate: new Date("2012-08-14"), nationalId: "1640000000013",
      bloodType: "B", addressHouseNo: "56", addressMoo: "3",
      guardians: [
        { firstName: "กิตติศักดิ์", lastName: "หาญกล้า", phone: "0833330005", relationId: por },
        { firstName: "อุดม",        lastName: "หาญกล้า", phone: "0833330006", relationId: mae },
      ],
    },
    {
      studentCode: "67210004", classNumber: 4, gradeLevel: "ม.2", classRoom: 1,
      titleId: dy, firstName: "ศิริพร", lastName: "แสนดี",
      birthDate: new Date("2012-11-03"), nationalId: "1640000000014",
      addressHouseNo: "78", addressMoo: "4",
      guardians: [
        { firstName: "ศิริพงษ์", lastName: "แสนดี", phone: "0833330007", relationId: por },
        { firstName: "วันดี",    lastName: "แสนดี", phone: "0833330008", relationId: mae },
      ],
    },
    {
      studentCode: "67210005", classNumber: 5, gradeLevel: "ม.2", classRoom: 1,
      titleId: dc, firstName: "พิพัฒน์", lastName: "เพชรไพลิน",
      birthDate: new Date("2012-01-19"), nationalId: "1640000000015",
      bloodType: "AB", addressHouseNo: "90", addressMoo: "5",
      guardians: [
        { firstName: "สุชาติ", lastName: "เพชรไพลิน", phone: "0833330009", relationId: por },
        { firstName: "นัยนา",  lastName: "เพชรไพลิน", phone: "0833330010", relationId: mae },
      ],
    },

    // ─── ม.2/2 ──────────────────────────────────────────────────────────────
    {
      studentCode: "67220001", classNumber: 1, gradeLevel: "ม.2", classRoom: 2,
      titleId: dc, firstName: "ธีรภัทร", lastName: "มากมี",
      birthDate: new Date("2012-04-07"), nationalId: "1640000000016",
      bloodType: "O", addressHouseNo: "13", addressMoo: "1",
      guardians: [
        { firstName: "ธนาธิป",  lastName: "มากมี", phone: "0844440001", relationId: por },
        { firstName: "ฉวีวรรณ", lastName: "มากมี", phone: "0844440002", relationId: mae },
      ],
    },
    {
      studentCode: "67220002", classNumber: 2, gradeLevel: "ม.2", classRoom: 2,
      titleId: dy, firstName: "กัลยา", lastName: "สมบูรณ์",
      birthDate: new Date("2012-07-22"), nationalId: "1640000000017",
      bloodType: "A", addressHouseNo: "35", addressMoo: "2",
      guardians: [
        { firstName: "กัมปนาท",  lastName: "สมบูรณ์", phone: "0844440003", relationId: por },
        { firstName: "มณีรัตน์", lastName: "สมบูรณ์", phone: "0844440004", relationId: mae },
      ],
    },
    {
      studentCode: "67220003", classNumber: 3, gradeLevel: "ม.2", classRoom: 2,
      titleId: dc, firstName: "จิรวัฒน์", lastName: "คงดี",
      birthDate: new Date("2012-09-30"), nationalId: "1640000000018",
      addressHouseNo: "57", addressMoo: "3",
      guardians: [
        { firstName: "จิรโรจน์", lastName: "คงดี", phone: "0844440005", relationId: por },
        { firstName: "สาวิตรี",  lastName: "คงดี", phone: "0844440006", relationId: mae },
      ],
    },
    {
      studentCode: "67220004", classNumber: 4, gradeLevel: "ม.2", classRoom: 2,
      titleId: dy, firstName: "รัชนีกร", lastName: "ดีงาม",
      birthDate: new Date("2012-12-16"), nationalId: "1640000000019",
      bloodType: "B", addressHouseNo: "79", addressMoo: "4",
      guardians: [
        { firstName: "รัชพงษ์", lastName: "ดีงาม", phone: "0844440007", relationId: ta  },
        { firstName: "สุดใจ",   lastName: "ดีงาม", phone: "0844440008", relationId: yai },
      ],
    },
    {
      studentCode: "67220005", classNumber: 5, gradeLevel: "ม.2", classRoom: 2,
      titleId: dc, firstName: "นิธิศ", lastName: "ทรัพย์มาก",
      birthDate: new Date("2012-02-25"), nationalId: "1640000000020",
      addressHouseNo: "91", addressMoo: "5",
      guardians: [
        { firstName: "นิติ",       lastName: "ทรัพย์มาก", phone: "0844440009", relationId: por },
        { firstName: "กนกวรรณ", lastName: "ทรัพย์มาก", phone: "0844440010", relationId: mae },
      ],
    },

    // ─── ม.3/1 ──────────────────────────────────────────────────────────────
    {
      studentCode: "67310001", classNumber: 1, gradeLevel: "ม.3", classRoom: 1,
      titleId: dc, firstName: "ปิยวัฒน์", lastName: "เกษมสุข",
      birthDate: new Date("2011-03-05"), nationalId: "1640000000021",
      bloodType: "O", addressHouseNo: "14", addressMoo: "1",
      guardians: [
        { firstName: "ปริญญา",  lastName: "เกษมสุข", phone: "0855550001", relationId: por },
        { firstName: "สุวรรณา", lastName: "เกษมสุข", phone: "0855550002", relationId: mae },
      ],
    },
    {
      studentCode: "67310002", classNumber: 2, gradeLevel: "ม.3", classRoom: 1,
      titleId: dy, firstName: "สุภาพร", lastName: "ชื่นจิตร",
      birthDate: new Date("2011-06-19"), nationalId: "1640000000022",
      bloodType: "A", addressHouseNo: "36", addressMoo: "2",
      guardians: [
        { firstName: "สุพจน์", lastName: "ชื่นจิตร", phone: "0855550003", relationId: por },
        { firstName: "อรทัย",  lastName: "ชื่นจิตร", phone: "0855550004", relationId: mae },
      ],
    },
    {
      studentCode: "67310003", classNumber: 3, gradeLevel: "ม.3", classRoom: 1,
      titleId: dc, firstName: "วรเมธ", lastName: "เนียมหอม",
      birthDate: new Date("2011-09-08"), nationalId: "1640000000023",
      bloodType: "B", addressHouseNo: "58", addressMoo: "3",
      guardians: [
        { firstName: "เมธา",   lastName: "เนียมหอม", phone: "0855550005", relationId: por },
        { firstName: "ทิพยา", lastName: "เนียมหอม", phone: "0855550006", relationId: mae },
      ],
    },
    {
      studentCode: "67310004", classNumber: 4, gradeLevel: "ม.3", classRoom: 1,
      titleId: dy, firstName: "ธัญพิชชา", lastName: "ฉัตรแก้ว",
      birthDate: new Date("2011-12-11"), nationalId: "1640000000024",
      addressHouseNo: "80", addressMoo: "4",
      guardians: [
        { firstName: "ธัญพงษ์", lastName: "ฉัตรแก้ว", phone: "0855550007", relationId: por },
        { firstName: "อรอุมา",  lastName: "ฉัตรแก้ว", phone: "0855550008", relationId: mae },
      ],
    },
    {
      studentCode: "67310005", classNumber: 5, gradeLevel: "ม.3", classRoom: 1,
      titleId: dc, firstName: "ณัฐดนัย", lastName: "รุ่งรัตน์",
      birthDate: new Date("2011-02-14"), nationalId: "1640000000025",
      bloodType: "AB", addressHouseNo: "92", addressMoo: "5",
      guardians: [
        { firstName: "ณรงค์ฤทธิ์", lastName: "รุ่งรัตน์", phone: "0855550009", relationId: ta  },
        { firstName: "อาภรณ์",      lastName: "รุ่งรัตน์", phone: "0855550010", relationId: yai },
      ],
    },

    // ─── ม.3/2 ──────────────────────────────────────────────────────────────
    {
      studentCode: "67320001", classNumber: 1, gradeLevel: "ม.3", classRoom: 2,
      titleId: dc, firstName: "ศุภวิชญ์", lastName: "ทองแท้",
      birthDate: new Date("2011-04-18"), nationalId: "1640000000026",
      bloodType: "O", addressHouseNo: "15", addressMoo: "1",
      guardians: [
        { firstName: "ศุภชัย",  lastName: "ทองแท้", phone: "0866660001", relationId: por },
        { firstName: "สมศรี",   lastName: "ทองแท้", phone: "0866660002", relationId: mae },
      ],
    },
    {
      studentCode: "67320002", classNumber: 2, gradeLevel: "ม.3", classRoom: 2,
      titleId: dy, firstName: "กนกพร", lastName: "แก้วใส",
      birthDate: new Date("2011-07-29"), nationalId: "1640000000027",
      bloodType: "A", addressHouseNo: "37", addressMoo: "2",
      guardians: [
        { firstName: "กนกศักดิ์", lastName: "แก้วใส", phone: "0866660003", relationId: por },
        { firstName: "กมลา",      lastName: "แก้วใส", phone: "0866660004", relationId: mae },
      ],
    },
    {
      studentCode: "67320003", classNumber: 3, gradeLevel: "ม.3", classRoom: 2,
      titleId: dc, firstName: "ชินวัตร", lastName: "บุญส่ง",
      birthDate: new Date("2011-10-14"), nationalId: "1640000000028",
      addressHouseNo: "59", addressMoo: "3",
      guardians: [
        { firstName: "ชินกร",  lastName: "บุญส่ง", phone: "0866660005", relationId: por },
        { firstName: "บุษบา", lastName: "บุญส่ง", phone: "0866660006", relationId: mae },
      ],
    },
    {
      studentCode: "67320004", classNumber: 4, gradeLevel: "ม.3", classRoom: 2,
      titleId: dy, firstName: "ภัทรธิดา", lastName: "สวยงาม",
      birthDate: new Date("2011-01-06"), nationalId: "1640000000029",
      bloodType: "B", addressHouseNo: "81", addressMoo: "4",
      guardians: [
        { firstName: "ภัทรพล", lastName: "สวยงาม", phone: "0866660007", relationId: por },
        { firstName: "ภาวิณี",  lastName: "สวยงาม", phone: "0866660008", relationId: mae },
      ],
    },
    {
      studentCode: "67320005", classNumber: 5, gradeLevel: "ม.3", classRoom: 2,
      titleId: dc, firstName: "พงศกร", lastName: "มั่นคง",
      birthDate: new Date("2011-08-23"), nationalId: "1640000000030",
      addressHouseNo: "93", addressMoo: "5",
      guardians: [
        { firstName: "พงษ์ศักดิ์", lastName: "มั่นคง", phone: "0866660009", relationId: por },
      ],
    },
  ];

  let studentCount = 0;
  let guardianCount = 0;

  for (const { guardians, addressHouseNo, addressMoo, ...rest } of students) {
    const student = await prisma.student.upsert({
      where: { studentCode: rest.studentCode },
      update: {},
      create: { ...localAddr, ...rest, addressHouseNo, addressMoo },
    });
    studentCount++;

    const existing = await prisma.guardian.count({ where: { studentId: student.id } });
    if (existing === 0) {
      await prisma.guardian.createMany({
        data: guardians.map((g) => ({ ...g, studentId: student.id })),
      });
      guardianCount += guardians.length;
    }
  }

  console.log(`✓ Students (${studentCount}), Guardians (${guardianCount})`);

  // ── 5. Student Advisors ───────────────────────────────────────────────────
  //
  //  Teachers by index: [2]=สมชาย [3]=วิภา [4]=มาลี [5]=อนันต์ [6]=สุดา [7]=ชาญชัย
  //
  //  Class       slot-1 (ครูที่ปรึกษาหลัก)   slot-2 (รอง)
  //  ม.1/1       สมชาย [2]                   สุดา [6]
  //  ม.1/2       สมชาย [2]                   ชาญชัย [7]
  //  ม.2/1       วิภา [3]                    อนันต์ [5]
  //  ม.2/2       วิภา [3]                    สุดา [6]
  //  ม.3/1       มาลี [4]                    ชาญชัย [7]
  //  ม.3/2       มาลี [4]                    อนันต์ [5]

  const allTeachers = await prisma.teacher.findMany({ orderBy: { id: "asc" } });
  const allStudents = await prisma.student.findMany({ orderBy: { id: "asc" } });
  const codeToId = Object.fromEntries(allStudents.map((s) => [s.studentCode, s.id]));

  const advisorMap: { codes: string[]; slot1: number; slot2: number }[] = [
    { codes: ["67110001","67110002","67110003","67110004","67110005"], slot1: 2, slot2: 6 },
    { codes: ["67120001","67120002","67120003","67120004","67120005"], slot1: 2, slot2: 7 },
    { codes: ["67210001","67210002","67210003","67210004","67210005"], slot1: 3, slot2: 5 },
    { codes: ["67220001","67220002","67220003","67220004","67220005"], slot1: 3, slot2: 6 },
    { codes: ["67310001","67310002","67310003","67310004","67310005"], slot1: 4, slot2: 7 },
    { codes: ["67320001","67320002","67320003","67320004","67320005"], slot1: 4, slot2: 5 },
  ];

  let advisorCount = 0;
  for (const { codes, slot1, slot2 } of advisorMap) {
    for (const code of codes) {
      const studentId = codeToId[code];
      const t1 = allTeachers[slot1]?.id;
      const t2 = allTeachers[slot2]?.id;
      if (!studentId || !t1 || !t2) continue;
      await prisma.studentAdvisor.upsert({
        where: { studentId_slot: { studentId, slot: 1 } },
        update: {},
        create: { studentId, teacherId: t1, slot: 1 },
      });
      await prisma.studentAdvisor.upsert({
        where: { studentId_slot: { studentId, slot: 2 } },
        update: {},
        create: { studentId, teacherId: t2, slot: 2 },
      });
      advisorCount += 2;
    }
  }

  console.log(`✓ StudentAdvisors (${advisorCount})`);

  // ── 6. Users ───────────────────────────────────────────────────────────────
  //
  //  username     teacher            password (initial)
  //  admin        (no teacher)       admin123
  //  prasert      ดร.ประเสริฐ        prasert123
  //  suree        นาง สุรีย์         suree123
  //  somchai      นาย สมชาย          somchai123
  //  wipa         นาง วิภา           wipa123
  //  malee        นางสาว มาลี        malee123
  //  anan         นาย อนันต์         anan123
  //  suda         นางสาว สุดา        suda123
  //  chanchai     นาย ชาญชัย         chanchai123

  const userSeeds: { username: string; password: string; teacherIndex: number | null }[] = [
    { username: "admin",    password: "admin123",    teacherIndex: null },
    { username: "prasert",  password: "prasert123",  teacherIndex: 0 },
    { username: "suree",    password: "suree123",    teacherIndex: 1 },
    { username: "somchai",  password: "somchai123",  teacherIndex: 2 },
    { username: "wipa",     password: "wipa123",     teacherIndex: 3 },
    { username: "malee",    password: "malee123",    teacherIndex: 4 },
    { username: "anan",     password: "anan123",     teacherIndex: 5 },
    { username: "suda",     password: "suda123",     teacherIndex: 6 },
    { username: "chanchai", password: "chanchai123", teacherIndex: 7 },
  ];

  for (const { username, password, teacherIndex } of userSeeds) {
    const teacherId = teacherIndex !== null ? allTeachers[teacherIndex]?.id ?? null : null;
    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        passwordHash: hashPassword(password),
        teacherId,
      },
    });
  }

  console.log(`✓ Users (${userSeeds.length}) — passwords hashed`);
  console.log("\n✅ Seed complete!");
  console.log("\n📋 Summary:");
  console.log("  Teachers with role 'หัวหน้าระดับชั้น': สมชาย, วิภา, มาลี");
  console.log("  Teachers with role 'ครูฝ่ายปกครอง': อนันต์, สุดา");
  console.log("  Teachers with signatureUrl: ประเสริฐ, สุรีย์, สมชาย, วิภา, มาลี, อนันต์, สุดา");
  console.log("  Teachers WITHOUT signatureUrl (null): ชาญชัย");
  console.log(`  Students: ${studentCount} (ม.1/1, ม.1/2, ม.2/1, ม.2/2, ม.3/1, ม.3/2)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
