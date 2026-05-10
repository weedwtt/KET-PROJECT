import { db as prisma } from "@/lib/db"
import { TeacherRole } from "@/lib/generated/prisma/client"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get("role") as TeacherRole | null

  const teachers = await prisma.teacher.findMany({
    where: role && Object.values(TeacherRole).includes(role) ? { role } : undefined,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: { select: { name: true } },
      signatureUrl: true,
      role: true,
    },
    orderBy: [{ firstName: "asc" }],
  })

  return NextResponse.json(teachers)
}
