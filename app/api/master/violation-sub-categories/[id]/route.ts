import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, violationCategoryId } = await req.json()
  const item = await db.violationSubCategory.update({
    where: { id: Number(id) },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(violationCategoryId ? { violationCategoryId: Number(violationCategoryId) } : {}),
    },
    include: { violationCategory: { select: { id: true, name: true } } },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.violationSubCategory.delete({ where: { id: Number(id) } })
  return new NextResponse(null, { status: 204 })
}
