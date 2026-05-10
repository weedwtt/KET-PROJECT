import { db as prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await prisma.violationCategory.findMany({ orderBy: { id: "asc" } })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { name } = await req.json()
  const item = await prisma.violationCategory.create({ data: { name } })
  return NextResponse.json(item, { status: 201 })
}
