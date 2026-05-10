import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const teachers = await db.teacher.findMany({
    where: { role: { in: ["ผอ", "รองผอ"] } },
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
