import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.teacherId) return NextResponse.json(null)

  const teacher = await db.teacher.findUnique({
    where: { id: session.user.teacherId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      signatureUrl: true,
      title: { select: { name: true } },
    },
  })

  return NextResponse.json(teacher)
}
