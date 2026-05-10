import { db as prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await prisma.semester.findMany({ orderBy: { value: "asc" } })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { name, value } = await req.json()
  const item = await prisma.semester.create({ data: { name, value: Number(value) } })
  return NextResponse.json(item, { status: 201 })
}
