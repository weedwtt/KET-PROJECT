import { NextRequest } from "next/server"
import { db } from "@/lib/db"

const INCLUDE_STUDENT = {
  student: {
    select: {
      id: true,
      studentCode: true,
      firstName: true,
      lastName: true,
      gradeLevel: true,
      classRoom: true,
      classNumber: true,
      title: { select: { name: true } },
    },
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"))
  const limit = 15
  const skip = (page - 1) * limit

  const where = {
    directorSignature: null,
    ...(q
      ? {
          OR: [
            { student: { studentCode: { contains: q } } },
            { student: { firstName: { contains: q } } },
            { student: { lastName: { contains: q } } },
            { guardianName: { contains: q } },
          ],
        }
      : {}),
  }

  const [total, records] = await Promise.all([
    db.bondRecord.count({ where }),
    db.bondRecord.findMany({
      where,
      include: {
        ...INCLUDE_STUDENT,
        headTeacher: { select: { id: true, firstName: true, lastName: true, title: { select: { name: true } }, signatureUrl: true } },
        disciplineTeacher: { select: { id: true, firstName: true, lastName: true, title: { select: { name: true } }, signatureUrl: true } },
        semester: { select: { value: true } },
        academicYear: { select: { year: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ])

  return Response.json({ records, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      contractDate,
      semesterId,
      academicYearId,
      guardianId,
      guardianName,
      guardianRelation,
      guardianPhone,
      addressHouseNo, addressMoo, addressVillage, addressRoad, addressSoi,
      addressSubDistrict, addressDistrict, addressProvince,
      violationDetail,
      measureDeductScore, measureDeductPoints,
      measureActivity, measureSuspension, measureTransfer,
      advisor1Name, advisor2Name,
      recorder,
      headTeacherId,
      headTeacherSignature,
      disciplineTeacherId,
      disciplineTeacherSignature,
      guardianSignature, studentSignature, advisorSignature,
      viceDirectorSignature, directorSignature,
    } = body

    if (!studentId || !contractDate || !guardianName || !violationDetail) {
      return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const record = await db.bondRecord.create({
      data: {
        studentId: Number(studentId),
        contractDate: new Date(contractDate),
        semesterId: semesterId ? Number(semesterId) : null,
        academicYearId: academicYearId ? Number(academicYearId) : null,
        guardianId: guardianId ? Number(guardianId) : null,
        guardianName,
        guardianRelation: guardianRelation ?? "",
        guardianPhone: guardianPhone || null,
        addressHouseNo: addressHouseNo || null,
        addressMoo: addressMoo || null,
        addressVillage: addressVillage || null,
        addressRoad: addressRoad || null,
        addressSoi: addressSoi || null,
        addressSubDistrict: addressSubDistrict || null,
        addressDistrict: addressDistrict || null,
        addressProvince: addressProvince || null,
        violationDetail,
        measureDeductScore: !!measureDeductScore,
        measureDeductPoints: measureDeductScore && measureDeductPoints ? Number(measureDeductPoints) : null,
        measureActivity: !!measureActivity,
        measureSuspension: !!measureSuspension,
        measureTransfer: !!measureTransfer,
        advisor1Name: advisor1Name || null,
        advisor2Name: advisor2Name || null,
        recorder: recorder || "",
        status: "active",
        headTeacherId: headTeacherId ? Number(headTeacherId) : null,
        headTeacherSignature: headTeacherSignature || null,
        disciplineTeacherId: disciplineTeacherId ? Number(disciplineTeacherId) : null,
        disciplineTeacherSignature: disciplineTeacherSignature || null,
        guardianSignature: guardianSignature || null,
        studentSignature: studentSignature || null,
        advisorSignature: advisorSignature || null,
        viceDirectorSignature: viceDirectorSignature || null,
        directorSignature: directorSignature || null,
      },
      include: { ...INCLUDE_STUDENT },
    })

    return Response.json(record, { status: 201 })
  } catch (err) {
    console.error("[POST /api/bonds]", err)
    return Response.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 })
  }
}
