import { expand } from "dotenv-expand";
import { config } from "dotenv";
expand(config({ path: ".env.local", override: false }));
expand(config({ path: ".env", override: false }));

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding...");

  // ── 1. Master Tables ──────────────────────────────────────────────────────

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

  console.log("✓ Master tables");

  // ── 2. Resolve IDs ────────────────────────────────────────────────────────

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
  //  ลำดับ (ใช้สำหรับผูก User ในอนาคต):
  //  [0] ผอ.ประเสริฐ  [1] รอง ผอ.สุรีย์
  //  [2] หน.ระดับ ม.1 สมชาย  [3] หน.ระดับ ม.2 วิภา  [4] หน.ระดับ ม.3 มาลี
  //  [5] อนันต์  [6] สุดา  [7] ชาญชัย

  const baseAddr = {
    addressSubDistrict: "บางพลีใหญ่",
    addressDistrict: "บางพลี",
    addressProvince: "สมุทรปราการ",
    addressPostalCode: "10540",
  };

  const teacherData = [
    // ── ผู้อำนวยการ
    {
      titleId: ttMap["ดร."],
      firstName: "ประเสริฐ",
      lastName: "วิทยาคม",
      phone: "0891111111",
      addressHouseNo: "99",
      addressMoo: "3",
      ...baseAddr,
    },
    // ── รองผู้อำนวยการ
    {
      titleId: ttMap["นาง"],
      firstName: "สุรีย์",
      lastName: "มีสุข",
      phone: "0892222222",
      addressHouseNo: "55",
      addressMoo: "1",
      ...baseAddr,
      addressSubDistrict: "บางโฉลง",
    },
    // ── หัวหน้าระดับ ม.1
    {
      titleId: ttMap["นาย"],
      firstName: "สมชาย",
      lastName: "ใจดี",
      phone: "0893333333",
      addressHouseNo: "12/3",
      addressMoo: "5",
      ...baseAddr,
    },
    // ── หัวหน้าระดับ ม.2
    {
      titleId: ttMap["นาง"],
      firstName: "วิภา",
      lastName: "รักเรียน",
      phone: "0894444444",
      addressHouseNo: "78",
      addressMoo: "2",
      ...baseAddr,
      addressSubDistrict: "ราชาเทวะ",
    },
    // ── หัวหน้าระดับ ม.3
    {
      titleId: ttMap["นางสาว"],
      firstName: "มาลี",
      lastName: "ดอกไม้",
      phone: "0895555555",
      addressHouseNo: "34",
      addressMoo: "4",
      ...baseAddr,
      addressSubDistrict: "หนองปรือ",
    },
    // ── ครูทั่วไป
    {
      titleId: ttMap["นาย"],
      firstName: "อนันต์",
      lastName: "สุขสวัสดิ์",
      phone: "0896666666",
      addressHouseNo: "101",
      addressMoo: "6",
      ...baseAddr,
    },
    {
      titleId: ttMap["นางสาว"],
      firstName: "สุดา",
      lastName: "รุ่งเรือง",
      phone: "0897777777",
      addressHouseNo: "22",
      addressMoo: "3",
      ...baseAddr,
    },
    {
      titleId: ttMap["นาย"],
      firstName: "ชาญชัย",
      lastName: "กล้าหาญ",
      phone: "0898888888",
      addressHouseNo: "67",
      addressMoo: "7",
      ...baseAddr,
    },
  ];

  await prisma.teacher.createMany({ data: teacherData, skipDuplicates: true });
  console.log(`✓ Teachers (${teacherData.length})`);

  // ── 4. Students + Guardians ───────────────────────────────────────────────

  type GuardianInput = {
    firstName: string;
    lastName: string;
    phone: string;
    relationId: number;
  };

  type StudentInput = {
    studentCode: string;
    classNumber: number;
    gradeLevel: string;
    classRoom: number;
    titleId: number;
    firstName: string;
    lastName: string;
    birthDate: Date;
    nationalId: string;
    phone?: string;
    bloodType?: string;
    addressHouseNo: string;
    addressMoo?: string;
    guardians: GuardianInput[];
  };

  const dc = titleMap["เด็กชาย"];
  const dy = titleMap["เด็กหญิง"];
  const por = relationMap["พ่อ"];
  const mae = relationMap["แม่"];
  const ta = relationMap["ตา"];
  const yai = relationMap["ยาย"];

  const localAddr = {
    addressSubDistrict: "บางพลีใหญ่",
    addressDistrict: "บางพลี",
    addressProvince: "สมุทรปราการ",
    addressPostalCode: "10540",
  };

  // รหัสนักเรียน: YY(ปีเข้า) + GC(ระดับ/ห้อง) + XXXX(ลำดับ)
  // เลขบัตร: สมมติ 1640000000XXX (ไม่ใช่ของจริง)
  const students: StudentInput[] = [
    // ────────────────── ม.1/1 ──────────────────────────────────────────────
    {
      studentCode: "67110001",
      classNumber: 1,
      gradeLevel: "ม.1",
      classRoom: 1,
      titleId: dc,
      firstName: "กิตติ",
      lastName: "ศรีสุวรรณ",
      birthDate: new Date("2013-03-15"),
      nationalId: "1640000000001",
      bloodType: "O",
      addressHouseNo: "10",
      addressMoo: "1",
      guardians: [
        { firstName: "สมศักดิ์", lastName: "ศรีสุวรรณ", phone: "0811110001", relationId: por },
        { firstName: "วรรณา", lastName: "ศรีสุวรรณ", phone: "0811110002", relationId: mae },
      ],
    },
    {
      studentCode: "67110002",
      classNumber: 2,
      gradeLevel: "ม.1",
      classRoom: 1,
      titleId: dy,
      firstName: "ปิยะดา",
      lastName: "ทองดี",
      birthDate: new Date("2013-06-20"),
      nationalId: "1640000000002",
      bloodType: "A",
      addressHouseNo: "23",
      addressMoo: "2",
      guardians: [
        { firstName: "ประสิทธิ์", lastName: "ทองดี", phone: "0811110003", relationId: por },
        { firstName: "นภา", lastName: "ทองดี", phone: "0811110004", relationId: mae },
      ],
    },
    {
      studentCode: "67110003",
      classNumber: 3,
      gradeLevel: "ม.1",
      classRoom: 1,
      titleId: dc,
      firstName: "ธนภัทร",
      lastName: "วงศ์ไพบูลย์",
      birthDate: new Date("2013-01-08"),
      nationalId: "1640000000003",
      bloodType: "B",
      addressHouseNo: "45",
      addressMoo: "3",
      guardians: [
        { firstName: "ไพบูลย์", lastName: "วงศ์ไพบูลย์", phone: "0811110005", relationId: por },
      ],
    },
    {
      studentCode: "67110004",
      classNumber: 4,
      gradeLevel: "ม.1",
      classRoom: 1,
      titleId: dy,
      firstName: "อาทิตยา",
      lastName: "สุขใจ",
      birthDate: new Date("2013-09-25"),
      nationalId: "1640000000004",
      bloodType: "AB",
      addressHouseNo: "67",
      addressMoo: "4",
      guardians: [
        { firstName: "สุทธิชัย", lastName: "สุขใจ", phone: "0811110007", relationId: por },
        { firstName: "รัตนา", lastName: "สุขใจ", phone: "0811110008", relationId: mae },
      ],
    },
    {
      studentCode: "67110005",
      classNumber: 5,
      gradeLevel: "ม.1",
      classRoom: 1,
      titleId: dc,
      firstName: "พชร",
      lastName: "เจริญพร",
      birthDate: new Date("2013-11-30"),
      nationalId: "1640000000005",
      addressHouseNo: "89",
      addressMoo: "5",
      guardians: [
        { firstName: "เจริญ", lastName: "เจริญพร", phone: "0811110009", relationId: por },
        { firstName: "สมปอง", lastName: "เจริญพร", phone: "0811110010", relationId: mae },
      ],
    },

    // ────────────────── ม.1/2 ──────────────────────────────────────────────
    {
      studentCode: "67120001",
      classNumber: 1,
      gradeLevel: "ม.1",
      classRoom: 2,
      titleId: dc,
      firstName: "นนทพัทธ์",
      lastName: "ชัยมงคล",
      birthDate: new Date("2013-04-12"),
      nationalId: "1640000000006",
      bloodType: "O",
      addressHouseNo: "11",
      addressMoo: "1",
      guardians: [
        { firstName: "ชัยณรงค์", lastName: "ชัยมงคล", phone: "0822220001", relationId: por },
        { firstName: "ลัดดา", lastName: "ชัยมงคล", phone: "0822220002", relationId: mae },
      ],
    },
    {
      studentCode: "67120002",
      classNumber: 2,
      gradeLevel: "ม.1",
      classRoom: 2,
      titleId: dy,
      firstName: "พิชญา",
      lastName: "ลำดวน",
      birthDate: new Date("2013-07-18"),
      nationalId: "1640000000007",
      bloodType: "A",
      addressHouseNo: "33",
      addressMoo: "2",
      guardians: [
        { firstName: "วิชัย", lastName: "ลำดวน", phone: "0822220003", relationId: ta },
        { firstName: "สุภา", lastName: "ลำดวน", phone: "0822220004", relationId: yai },
      ],
    },
    {
      studentCode: "67120003",
      classNumber: 3,
      gradeLevel: "ม.1",
      classRoom: 2,
      titleId: dc,
      firstName: "ณัฐพล",
      lastName: "ระวังภัย",
      birthDate: new Date("2013-02-22"),
      nationalId: "1640000000008",
      addressHouseNo: "55",
      addressMoo: "3",
      guardians: [
        { firstName: "ณรงค์", lastName: "ระวังภัย", phone: "0822220005", relationId: por },
        { firstName: "กานดา", lastName: "ระวังภัย", phone: "0822220006", relationId: mae },
      ],
    },
    {
      studentCode: "67120004",
      classNumber: 4,
      gradeLevel: "ม.1",
      classRoom: 2,
      titleId: dy,
      firstName: "จิดาภา",
      lastName: "สวัสดิ์",
      birthDate: new Date("2013-10-05"),
      nationalId: "1640000000009",
      bloodType: "B",
      addressHouseNo: "77",
      addressMoo: "4",
      guardians: [
        { firstName: "อภิชัย", lastName: "สวัสดิ์", phone: "0822220007", relationId: por },
        { firstName: "อัมพร", lastName: "สวัสดิ์", phone: "0822220008", relationId: mae },
      ],
    },
    {
      studentCode: "67120005",
      classNumber: 5,
      gradeLevel: "ม.1",
      classRoom: 2,
      titleId: dc,
      firstName: "วรากร",
      lastName: "บัวงาม",
      birthDate: new Date("2013-12-01"),
      nationalId: "1640000000010",
      addressHouseNo: "99",
      addressMoo: "5",
      guardians: [
        { firstName: "บุญมี", lastName: "บัวงาม", phone: "0822220009", relationId: por },
      ],
    },

    // ────────────────── ม.2/1 ──────────────────────────────────────────────
    {
      studentCode: "67210001",
      classNumber: 1,
      gradeLevel: "ม.2",
      classRoom: 1,
      titleId: dc,
      firstName: "ภูวนาท",
      lastName: "ดาวเรือง",
      birthDate: new Date("2012-03-10"),
      nationalId: "1640000000011",
      bloodType: "O",
      addressHouseNo: "12",
      addressMoo: "1",
      guardians: [
        { firstName: "ประพันธ์", lastName: "ดาวเรือง", phone: "0833330001", relationId: por },
        { firstName: "อรุณี", lastName: "ดาวเรือง", phone: "0833330002", relationId: mae },
      ],
    },
    {
      studentCode: "67210002",
      classNumber: 2,
      gradeLevel: "ม.2",
      classRoom: 1,
      titleId: dy,
      firstName: "ณิชากร",
      lastName: "พลอยงาม",
      birthDate: new Date("2012-05-28"),
      nationalId: "1640000000012",
      bloodType: "A",
      addressHouseNo: "34",
      addressMoo: "2",
      guardians: [
        { firstName: "สมบัติ", lastName: "พลอยงาม", phone: "0833330003", relationId: por },
        { firstName: "ปราณี", lastName: "พลอยงาม", phone: "0833330004", relationId: mae },
      ],
    },
    {
      studentCode: "67210003",
      classNumber: 3,
      gradeLevel: "ม.2",
      classRoom: 1,
      titleId: dc,
      firstName: "กวิน",
      lastName: "หาญกล้า",
      birthDate: new Date("2012-08-14"),
      nationalId: "1640000000013",
      bloodType: "B",
      addressHouseNo: "56",
      addressMoo: "3",
      guardians: [
        { firstName: "กิตติศักดิ์", lastName: "หาญกล้า", phone: "0833330005", relationId: por },
        { firstName: "อุดม", lastName: "หาญกล้า", phone: "0833330006", relationId: mae },
      ],
    },
    {
      studentCode: "67210004",
      classNumber: 4,
      gradeLevel: "ม.2",
      classRoom: 1,
      titleId: dy,
      firstName: "ศิริพร",
      lastName: "แสนดี",
      birthDate: new Date("2012-11-03"),
      nationalId: "1640000000014",
      addressHouseNo: "78",
      addressMoo: "4",
      guardians: [
        { firstName: "ศิริพงษ์", lastName: "แสนดี", phone: "0833330007", relationId: por },
        { firstName: "วันดี", lastName: "แสนดี", phone: "0833330008", relationId: mae },
      ],
    },
    {
      studentCode: "67210005",
      classNumber: 5,
      gradeLevel: "ม.2",
      classRoom: 1,
      titleId: dc,
      firstName: "พิพัฒน์",
      lastName: "เพชรไพลิน",
      birthDate: new Date("2012-01-19"),
      nationalId: "1640000000015",
      bloodType: "AB",
      addressHouseNo: "90",
      addressMoo: "5",
      guardians: [
        { firstName: "สุชาติ", lastName: "เพชรไพลิน", phone: "0833330009", relationId: por },
        { firstName: "นัยนา", lastName: "เพชรไพลิน", phone: "0833330010", relationId: mae },
      ],
    },

    // ────────────────── ม.2/2 ──────────────────────────────────────────────
    {
      studentCode: "67220001",
      classNumber: 1,
      gradeLevel: "ม.2",
      classRoom: 2,
      titleId: dc,
      firstName: "ธีรภัทร",
      lastName: "มากมี",
      birthDate: new Date("2012-04-07"),
      nationalId: "1640000000016",
      bloodType: "O",
      addressHouseNo: "13",
      addressMoo: "1",
      guardians: [
        { firstName: "ธนาธิป", lastName: "มากมี", phone: "0844440001", relationId: por },
        { firstName: "ฉวีวรรณ", lastName: "มากมี", phone: "0844440002", relationId: mae },
      ],
    },
    {
      studentCode: "67220002",
      classNumber: 2,
      gradeLevel: "ม.2",
      classRoom: 2,
      titleId: dy,
      firstName: "กัลยา",
      lastName: "สมบูรณ์",
      birthDate: new Date("2012-07-22"),
      nationalId: "1640000000017",
      bloodType: "A",
      addressHouseNo: "35",
      addressMoo: "2",
      guardians: [
        { firstName: "กัมปนาท", lastName: "สมบูรณ์", phone: "0844440003", relationId: por },
        { firstName: "มณีรัตน์", lastName: "สมบูรณ์", phone: "0844440004", relationId: mae },
      ],
    },
    {
      studentCode: "67220003",
      classNumber: 3,
      gradeLevel: "ม.2",
      classRoom: 2,
      titleId: dc,
      firstName: "จิรวัฒน์",
      lastName: "คงดี",
      birthDate: new Date("2012-09-30"),
      nationalId: "1640000000018",
      addressHouseNo: "57",
      addressMoo: "3",
      guardians: [
        { firstName: "จิรโรจน์", lastName: "คงดี", phone: "0844440005", relationId: por },
        { firstName: "สาวิตรี", lastName: "คงดี", phone: "0844440006", relationId: mae },
      ],
    },
    {
      studentCode: "67220004",
      classNumber: 4,
      gradeLevel: "ม.2",
      classRoom: 2,
      titleId: dy,
      firstName: "รัชนีกร",
      lastName: "ดีงาม",
      birthDate: new Date("2012-12-16"),
      nationalId: "1640000000019",
      bloodType: "B",
      addressHouseNo: "79",
      addressMoo: "4",
      guardians: [
        { firstName: "รัชพงษ์", lastName: "ดีงาม", phone: "0844440007", relationId: ta },
        { firstName: "สุดใจ", lastName: "ดีงาม", phone: "0844440008", relationId: yai },
      ],
    },
    {
      studentCode: "67220005",
      classNumber: 5,
      gradeLevel: "ม.2",
      classRoom: 2,
      titleId: dc,
      firstName: "นิธิศ",
      lastName: "ทรัพย์มาก",
      birthDate: new Date("2012-02-25"),
      nationalId: "1640000000020",
      addressHouseNo: "91",
      addressMoo: "5",
      guardians: [
        { firstName: "นิติ", lastName: "ทรัพย์มาก", phone: "0844440009", relationId: por },
        { firstName: "กนกวรรณ", lastName: "ทรัพย์มาก", phone: "0844440010", relationId: mae },
      ],
    },

    // ────────────────── ม.3/1 ──────────────────────────────────────────────
    {
      studentCode: "67310001",
      classNumber: 1,
      gradeLevel: "ม.3",
      classRoom: 1,
      titleId: dc,
      firstName: "ปิยวัฒน์",
      lastName: "เกษมสุข",
      birthDate: new Date("2011-03-05"),
      nationalId: "1640000000021",
      bloodType: "O",
      addressHouseNo: "14",
      addressMoo: "1",
      guardians: [
        { firstName: "ปริญญา", lastName: "เกษมสุข", phone: "0855550001", relationId: por },
        { firstName: "สุวรรณา", lastName: "เกษมสุข", phone: "0855550002", relationId: mae },
      ],
    },
    {
      studentCode: "67310002",
      classNumber: 2,
      gradeLevel: "ม.3",
      classRoom: 1,
      titleId: dy,
      firstName: "สุภาพร",
      lastName: "ชื่นจิตร",
      birthDate: new Date("2011-06-19"),
      nationalId: "1640000000022",
      bloodType: "A",
      addressHouseNo: "36",
      addressMoo: "2",
      guardians: [
        { firstName: "สุพจน์", lastName: "ชื่นจิตร", phone: "0855550003", relationId: por },
        { firstName: "อรทัย", lastName: "ชื่นจิตร", phone: "0855550004", relationId: mae },
      ],
    },
    {
      studentCode: "67310003",
      classNumber: 3,
      gradeLevel: "ม.3",
      classRoom: 1,
      titleId: dc,
      firstName: "วรเมธ",
      lastName: "เนียมหอม",
      birthDate: new Date("2011-09-08"),
      nationalId: "1640000000023",
      bloodType: "B",
      addressHouseNo: "58",
      addressMoo: "3",
      guardians: [
        { firstName: "เมธา", lastName: "เนียมหอม", phone: "0855550005", relationId: por },
        { firstName: "ทิพยา", lastName: "เนียมหอม", phone: "0855550006", relationId: mae },
      ],
    },
    {
      studentCode: "67310004",
      classNumber: 4,
      gradeLevel: "ม.3",
      classRoom: 1,
      titleId: dy,
      firstName: "ธัญพิชชา",
      lastName: "ฉัตรแก้ว",
      birthDate: new Date("2011-12-11"),
      nationalId: "1640000000024",
      addressHouseNo: "80",
      addressMoo: "4",
      guardians: [
        { firstName: "ธัญพงษ์", lastName: "ฉัตรแก้ว", phone: "0855550007", relationId: por },
        { firstName: "อรอุมา", lastName: "ฉัตรแก้ว", phone: "0855550008", relationId: mae },
      ],
    },
    {
      studentCode: "67310005",
      classNumber: 5,
      gradeLevel: "ม.3",
      classRoom: 1,
      titleId: dc,
      firstName: "ณัฐดนัย",
      lastName: "รุ่งรัตน์",
      birthDate: new Date("2011-02-14"),
      nationalId: "1640000000025",
      bloodType: "AB",
      addressHouseNo: "92",
      addressMoo: "5",
      guardians: [
        { firstName: "ณรงค์ฤทธิ์", lastName: "รุ่งรัตน์", phone: "0855550009", relationId: ta },
        { firstName: "อาภรณ์", lastName: "รุ่งรัตน์", phone: "0855550010", relationId: yai },
      ],
    },
  ];

  let studentCount = 0;
  let guardianCount = 0;

  for (const { guardians, addressHouseNo, addressMoo, ...rest } of students) {
    const student = await prisma.student.upsert({
      where: { studentCode: rest.studentCode },
      update: {},
      create: {
        ...rest,
        nationality: "ไทย",
        ethnicity: "ไทย",
        religion: "พุทธ",
        addressHouseNo,
        addressMoo,
        ...localAddr,
      },
    });
    studentCount++;

    const hasGuardians = await prisma.guardian.count({
      where: { studentId: student.id },
    });
    if (hasGuardians === 0) {
      await prisma.guardian.createMany({
        data: guardians.map((g) => ({ ...g, studentId: student.id })),
      });
      guardianCount += guardians.length;
    }
  }

  console.log(`✓ Students (${studentCount}), Guardians (${guardianCount})`);
  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
