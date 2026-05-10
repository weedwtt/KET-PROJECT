import { db } from "@/lib/db"
import { TeacherRole } from "@/lib/generated/prisma/client"
import { NextResponse } from "next/server"

export async function GET() {
  const teachers = await db.teacher.findMany({
    where: { role: { in: [TeacherRole.DIRECTOR, TeacherRole.VICE_DIRECTOR] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      title: { select: { name: true } },
    },
    orderBy: [{ role: "asc" }, { firstName: "asc" }],
  })
  return NextResponse.json(teachers)
}
