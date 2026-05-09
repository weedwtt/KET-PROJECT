import { expand } from "dotenv-expand";
import { config } from "dotenv";
expand(config({ path: ".env.local", override: false }));
expand(config({ path: ".env", override: false }));

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

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
