import { db } from "@/lib/db"
import { TeacherRole, GradeHeadLevel } from "@/lib/generated/prisma/client"
import { hashPassword } from "@/lib/password"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")?.trim() ?? ""
  const all = searchParams.get("all") === "true"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const pageSize = all ? 500 : 20

  const where = search
    ? {
        OR: [
          { username: { contains: search, mode: "insensitive" as const } },
          { teacher: { firstName: { contains: search, mode: "insensitive" as const } } },
          { teacher: { lastName: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {}

  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      include: {
        teacher: {
          include: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return NextResponse.json({ total, page, pageSize, rows })
}

export async function POST(req: Request) {
  const body = await req.json()

  const { username, password, ...teacherData } = body

  if (!username || !password) {
    return NextResponse.json({ error: "กรุณาระบุชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" }, { status: 409 })
  }

  const passwordHash = hashPassword(password)

  const user = await db.user.create({
    data: {
      username,
      passwordHash,
      teacher: {
        create: {
          titleId: Number(teacherData.titleId),
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          phone: teacherData.phone,
          role: teacherData.role ? (teacherData.role as TeacherRole) : null,
          gradeHeadLevel: teacherData.gradeHeadLevel ? (teacherData.gradeHeadLevel as GradeHeadLevel) : null,
          signatureUrl: teacherData.signatureUrl || null,
          signatureUpdatedAt: teacherData.signatureUrl ? new Date() : null,
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
      },
    },
    include: {
      teacher: { include: { title: true } },
    },
  })

  return NextResponse.json(user, { status: 201 })
}
