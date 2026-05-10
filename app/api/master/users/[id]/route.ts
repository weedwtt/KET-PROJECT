import { db } from "@/lib/db"
import { TeacherRole, GradeHeadLevel } from "@/lib/generated/prisma/client"
import { hashPassword } from "@/lib/password"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await db.user.findUnique({
    where: { id: Number(id) },
    include: { teacher: { include: { title: true } } },
  })
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 })
  const { passwordHash: _, ...safe } = user
  return NextResponse.json(safe)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const { username, password, teacherId, ...teacherData } = body

  const existingUser = await db.user.findUnique({ where: { id: Number(id) } })
  if (!existingUser) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 })

  if (username && username !== existingUser.username) {
    const conflict = await db.user.findUnique({ where: { username } })
    if (conflict) return NextResponse.json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" }, { status: 409 })
  }

  const userUpdate: Record<string, unknown> = {}
  if (username) userUpdate.username = username
  if (password) userUpdate.passwordHash = hashPassword(password)

  const prevSignatureUrl = existingUser.teacherId
    ? (await db.teacher.findUnique({ where: { id: existingUser.teacherId }, select: { signatureUrl: true } }))?.signatureUrl
    : null

  const [updatedUser] = await Promise.all([
    db.user.update({
      where: { id: Number(id) },
      data: userUpdate,
      include: { teacher: { include: { title: true } } },
    }),
    teacherId
      ? db.teacher.update({
          where: { id: Number(teacherId) },
          data: {
            titleId: Number(teacherData.titleId),
            firstName: teacherData.firstName,
            lastName: teacherData.lastName,
            phone: teacherData.phone,
            role: teacherData.role ? (teacherData.role as TeacherRole) : null,
            gradeHeadLevel: teacherData.gradeHeadLevel ? (teacherData.gradeHeadLevel as GradeHeadLevel) : null,
            signatureUrl: teacherData.signatureUrl || null,
            signatureUpdatedAt:
              teacherData.signatureUrl && teacherData.signatureUrl !== prevSignatureUrl ? new Date() : undefined,
            addressHouseNo: teacherData.addressHouseNo,
            addressMoo: teacherData.addressMoo || null,
            addressVillage: teacherData.addressVillage || null,
            addressRoad: teacherData.addressRoad || null,
            addressSoi: teacherData.addressSoi || null,
            addressSubDistrict: teacherData.addressSubDistrict,
            addressDistrict: teacherData.addressDistrict,
            addressProvince: teacherData.addressProvince,
            addressPostalCode: teacherData.addressPostalCode,
          },
        })
      : Promise.resolve(),
  ])

  const { passwordHash: _, ...safe } = updatedUser
  return NextResponse.json(safe)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await db.user.findUnique({ where: { id: Number(id) } })
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 })

  await db.$transaction(async (tx) => {
    await tx.user.delete({ where: { id: Number(id) } })
    if (user.teacherId) {
      await tx.teacher.delete({ where: { id: user.teacherId } })
    }
  })

  return new NextResponse(null, { status: 204 })
}
