import { NextRequest } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      studentId,
      semesterId,
      academicYearId,
      violationCategoryId,
      subject,
      detail,
      incidentDateTime,
      location,
      recorder,
    } = body

    if (!studentId || !semesterId || !academicYearId || !violationCategoryId || !subject || !detail || !recorder) {
      return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const incidentAt = incidentDateTime ? new Date(incidentDateTime) : null

    const record = await db.statementRecord.create({
      data: {
        studentId: Number(studentId),
        recordDate: new Date(),
        semesterId: Number(semesterId),
        academicYearId: Number(academicYearId),
        violationCategoryId: Number(violationCategoryId),
        subject,
        content: detail,
        incidentAt,
        location: location ?? null,
        recordedBy: recorder,
      },
    })

    return Response.json({ id: record.id }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/statements]", err)
    return Response.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 })
  }
}
