import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { parseIncidentDateTime } from "@/lib/datetime"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      studentId,
      semesterId,
      academicYearId,
      violationCategoryId,
      violationSubCategoryId,
      subject,
      detail,
      incidentDateTime,
      location,
      advisor1Name,
      advisor2Name,
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
      disciplineTeacherSignature,
      gradeHeadTeacherId,
      gradeHeadSignature,
    } = body

    if (!studentId || !semesterId || !academicYearId || !violationCategoryId || !subject || !detail) {
      return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const incidentAt = parseIncidentDateTime(incidentDateTime)

    const isSystemDiscipline = !!disciplineTeacherId && !disciplineTeacherSignature
    const isSystemGradeHead = !!gradeHeadTeacherId && !gradeHeadSignature
    // ถ้าทั้งคู่จากระบบ → รอลงนามพร้อมกัน (parallel)
    // ถ้าเพียงคนเดียว → รอคนนั้น
    const initialStatus = isSystemDiscipline && isSystemGradeHead ? "pending_teacher_signatures"
      : isSystemDiscipline ? "pending_discipline_teacher"
      : isSystemGradeHead ? "pending_grade_head"
      : "pending"

    const record = await db.statementRecord.create({
      data: {
        studentId: Number(studentId),
        recordDate: new Date(),
        semesterId: Number(semesterId),
        academicYearId: Number(academicYearId),
        violationCategoryId: Number(violationCategoryId),
        violationSubCategoryId: violationSubCategoryId ? Number(violationSubCategoryId) : null,
        subject,
        content: detail,
        incidentAt,
        location: location ?? null,
        advisor1Name: advisor1Name || null,
        advisor2Name: advisor2Name || null,
        recordedBy: recorder || null,
        // Step 4
        considerationMeasures: Array.isArray(considerationMeasures) ? considerationMeasures : [],
        resultMeasures: Array.isArray(resultMeasures) ? resultMeasures : [],
        measureNotes: measureNotes || null,
        // Step 5 Signatures
        studentSignature: studentSignature || null,
        guardianSignature: guardianSignature || null,
        advisorSignature: advisorSignature || null,
        disciplineTeacherId: disciplineTeacherId ? Number(disciplineTeacherId) : null,
        disciplineTeacherSignature: disciplineTeacherSignature || null,
        gradeHeadTeacherId: gradeHeadTeacherId ? Number(gradeHeadTeacherId) : null,
        gradeHeadSignature: gradeHeadSignature || null,
        status: initialStatus,
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
