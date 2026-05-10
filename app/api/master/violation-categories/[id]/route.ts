import { db as prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name } = await req.json()
  const item = await prisma.violationCategory.update({
    where: { id: Number(id) },
    data: { name },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.violationCategory.delete({ where: { id: Number(id) } })
  return new NextResponse(null, { status: 204 })
}
