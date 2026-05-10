import { db as prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await prisma.academicYear.findMany({ orderBy: { year: "desc" } })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { year } = await req.json()
  const item = await prisma.academicYear.create({ data: { year: Number(year) } })
  return NextResponse.json(item, { status: 201 })
}
