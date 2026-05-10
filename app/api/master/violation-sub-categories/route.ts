import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")

  const where = categoryId ? { violationCategoryId: Number(categoryId) } : {}
  const data = await db.violationSubCategory.findMany({
    where,
    include: { violationCategory: { select: { id: true, name: true } } },
    orderBy: [{ violationCategoryId: "asc" }, { id: "asc" }],
  })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { name, violationCategoryId } = await req.json()
  if (!name?.trim() || !violationCategoryId) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
  }
  const item = await db.violationSubCategory.create({
    data: { name: name.trim(), violationCategoryId: Number(violationCategoryId) },
    include: { violationCategory: { select: { id: true, name: true } } },
  })
  return NextResponse.json(item, { status: 201 })
}
