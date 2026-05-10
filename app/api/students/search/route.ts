import { NextRequest } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (!q || q.length < 1) {
    return Response.json({ error: "กรุณาระบุคำค้นหา" }, { status: 400 })
  }

  const students = await db.student.findMany({
    where: {
      OR: [
        { studentCode: { contains: q } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      studentCode: true,
      classNumber: true,
      gradeLevel: true,
      classRoom: true,
      firstName: true,
      lastName: true,
      nationalId: true,
      birthDate: true,
      phone: true,
      nationality: true,
      ethnicity: true,
      religion: true,
      bloodType: true,
      addressHouseNo: true,
      addressMoo: true,
      addressVillage: true,
      addressRoad: true,
      addressSoi: true,
      addressSubDistrict: true,
      addressDistrict: true,
      addressProvince: true,
      addressPostalCode: true,
      title: { select: { name: true } },
      guardians: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          relation: { select: { name: true } },
        },
      },
      advisors: {
        select: {
          slot: true,
          teacher: {
            select: {
              firstName: true,
              lastName: true,
              title: { select: { name: true } },
            },
          },
        },
        orderBy: { slot: "asc" },
      },
    },
    take: 20,
  })

  return Response.json(students)
}
