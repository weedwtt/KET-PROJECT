import { db } from "@/lib/db"
import { TeacherRole, GradeHeadLevel } from "@/lib/generated/prisma/client"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const teacher = await db.teacher.findUnique({
    where: { id: Number(id) },
    include: { title: true, user: { select: { id: true, username: true } } },
  })
  if (!teacher) return NextResponse.json({ error: "ไม่พบครู" }, { status: 404 })
  return NextResponse.json(teacher)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const prevSignatureUrl = (await db.teacher.findUnique({ where: { id: Number(id) }, select: { signatureUrl: true } }))?.signatureUrl

  const teacher = await db.teacher.update({
    where: { id: Number(id) },
    data: {
      titleId: Number(body.titleId),
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      role: body.role ? (body.role as TeacherRole) : null,
      gradeHeadLevel: body.gradeHeadLevel ? (body.gradeHeadLevel as GradeHeadLevel) : null,
      signatureUrl: body.signatureUrl || null,
      signatureUpdatedAt: body.signatureUrl && body.signatureUrl !== prevSignatureUrl ? new Date() : undefined,
      addressHouseNo: body.addressHouseNo,
      addressMoo: body.addressMoo || null,
      addressVillage: body.addressVillage || null,
      addressRoad: body.addressRoad || null,
      addressSoi: body.addressSoi || null,
      addressSubDistrict: body.addressSubDistrict,
      addressDistrict: body.addressDistrict,
      addressProvince: body.addressProvince,
      addressPostalCode: body.addressPostalCode,
    },
    include: { title: true },
  })

  return NextResponse.json(teacher)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const teacher = await db.teacher.findUnique({
    where: { id: Number(id) },
    select: { user: { select: { id: true } } },
  })
  if (teacher?.user) {
    return NextResponse.json({ error: "ไม่สามารถลบครูที่มีบัญชีผู้ใช้งานได้ กรุณาลบบัญชีผู้ใช้ก่อน" }, { status: 400 })
  }
  await db.teacher.delete({ where: { id: Number(id) } })
  return new NextResponse(null, { status: 204 })
}
