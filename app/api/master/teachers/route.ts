import { db } from "@/lib/db"
import { TeacherRole, GradeHeadLevel } from "@/lib/generated/prisma/client"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")?.trim() ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const all = searchParams.get("all") === "true"
  const pageSize = all ? 500 : 20

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [total, rows] = await Promise.all([
    db.teacher.count({ where }),
    db.teacher.findMany({
      where,
      include: {
        title: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return NextResponse.json({ total, page, pageSize, rows })
}

export async function POST(req: Request) {
  const body = await req.json()

  const teacher = await db.teacher.create({
    data: {
      titleId: Number(body.titleId),
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      role: body.role ? (body.role as TeacherRole) : null,
      gradeHeadLevel: body.gradeHeadLevel ? (body.gradeHeadLevel as GradeHeadLevel) : null,
      signatureUrl: body.signatureUrl || null,
      signatureUpdatedAt: body.signatureUrl ? new Date() : null,
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

  return NextResponse.json(teacher, { status: 201 })
}
