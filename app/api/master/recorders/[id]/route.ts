import { db as prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "ชื่อผู้บันทึกห้ามว่าง" }, { status: 400 })
  const item = await prisma.recorder.update({
    where: { id: Number(id) },
    data: { name: name.trim() },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.recorder.delete({ where: { id: Number(id) } })
  return new NextResponse(null, { status: 204 })
}
