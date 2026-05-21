import { db as prisma } from "@/lib/db"
import { TeacherRole } from "@/lib/generated/prisma/client"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get("role")

  let where: Parameters<typeof prisma.teacher.findMany>[0]["where"]
  if (role === "หัวหน้าระดับชั้น") {
    where = { gradeHeadLevel: { not: null } }
  } else if (role && Object.values(TeacherRole).includes(role as TeacherRole)) {
    where = { role: role as TeacherRole }
  }

  const teachers = await prisma.teacher.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: { select: { name: true } },
      signatureUrl: true,
      role: true,
      gradeHeadLevel: true,
    },
    orderBy: [{ gradeHeadLevel: "asc" }, { firstName: "asc" }],
  })

  return NextResponse.json(teachers)
}
