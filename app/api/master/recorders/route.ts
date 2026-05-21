import { db as prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await prisma.recorder.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "ชื่อผู้บันทึกห้ามว่าง" }, { status: 400 })
  const item = await prisma.recorder.create({ data: { name: name.trim() } })
  return NextResponse.json(item, { status: 201 })
}
