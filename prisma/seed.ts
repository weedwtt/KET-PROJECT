import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
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

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
