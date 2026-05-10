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
      // Step 4
      considerationMeasures,
      resultMeasures,
      measureNotes,
      // Step 5 Bond
      bond,
      // Step 5 Signatures
      studentSignature,
      guardianSignature,
      advisorSignature,
      disciplineTeacherId,
      gradeHeadTeacherId,
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
        // Step 4
        considerationMeasures: Array.isArray(considerationMeasures) ? considerationMeasures : [],
        resultMeasures: Array.isArray(resultMeasures) ? resultMeasures : [],
        measureNotes: measureNotes || null,
        // Step 5 Signatures
        studentSignature: studentSignature || null,
        guardianSignature: guardianSignature || null,
        advisorSignature: advisorSignature || null,
        disciplineTeacherId: disciplineTeacherId ? Number(disciplineTeacherId) : null,
        gradeHeadTeacherId: gradeHeadTeacherId ? Number(gradeHeadTeacherId) : null,
        // Step 5 Bond (created inline via nested write)
        ...(bond && bond.guardianId
          ? {
              bond: {
                create: {
                  guardianId: Number(bond.guardianId),
                  penaltyActions: Array.isArray(bond.penaltyActions) ? bond.penaltyActions : [],
                  deductPoints: bond.deductPoints ? Number(bond.deductPoints) : null,
                  witnessName: bond.witnessName || null,
                },
              },
            }
          : {}),
      },
    })

    return Response.json({ id: record.id }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/statements]", err)
    return Response.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 })
  }
}
