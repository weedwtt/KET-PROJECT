import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  const role = session?.user?.role
  const teacherId = session?.user?.teacherId

  const isApprover = role === "DIRECTOR" || role === "VICE_DIRECTOR" || role === "ADMIN"

  // ทัณฑ์บนต้องผ่านลายเซ็นครู (หัวหน้าระดับ + ฝ่ายปกครอง) ก่อนจึงถึงคิวผู้บริหาร
  const teachersSigned = [
    { OR: [{ headTeacherId: null }, { headTeacherSignature: { not: null } }] },
    { OR: [{ disciplineTeacherId: null }, { disciplineTeacherSignature: { not: null } }] },
  ]

  if (isApprover) {
    // นับเฉพาะคิวของ role ตัวเอง — รองผอ.เห็น "pending", ผอ.เห็น "pending_director"
    // ADMIN ทำได้ทุกขั้น จึงนับทั้งสอง (ตรงกับ logic หน้า /dashboard/approve)
    const statementStatuses =
      role === "VICE_DIRECTOR" ? ["pending"]
      : role === "DIRECTOR" ? ["pending_director"]
      : ["pending", "pending_director"]

    const bondWhere =
      role === "VICE_DIRECTOR"
        ? { viceDirectorSignature: null, directorSignature: null, AND: teachersSigned }
        : role === "DIRECTOR"
        ? { viceDirectorSignature: { not: null }, directorSignature: null, AND: teachersSigned }
        : { directorSignature: null, AND: teachersSigned }

    const [statements, bonds] = await Promise.all([
      db.statementRecord.count({ where: { status: { in: statementStatuses } } }),
      db.bondRecord.count({ where: bondWhere }),
    ])
    return Response.json({ count: statements + bonds })
  }

  if (teacherId) {
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      select: {
        role: true,
        gradeHeadLevel: true,
        delegateFor: { select: { id: true } },
      },
    })

    if (teacher?.role === "DISCIPLINE") {
      // นับเฉพาะรายการที่ assign มาที่ตนเอง และตนเองยังไม่ได้ลงนาม
      const [statementCount, bondCount] = await Promise.all([
        db.statementRecord.count({
          where: {
            status: { in: ["pending_discipline_teacher", "pending_teacher_signatures"] },
            disciplineTeacherId: teacherId,
            disciplineTeacherSignature: null,
          },
        }),
        db.bondRecord.count({
          where: {
            disciplineTeacherId: teacherId,
            disciplineTeacherSignature: null,
            directorSignature: null,
          },
        }),
      ])
      return Response.json({ count: statementCount + bondCount })
    }

    if (teacher?.gradeHeadLevel) {
      // นับเฉพาะรายการที่ assign มาที่ตนเอง และตนเองยังไม่ได้ลงนาม
      const [statementCount, bondCount] = await Promise.all([
        db.statementRecord.count({
          where: {
            status: { in: ["pending_grade_head", "pending_teacher_signatures"] },
            gradeHeadTeacherId: teacherId,
            gradeHeadSignature: null,
          },
        }),
        db.bondRecord.count({
          where: {
            headTeacherId: teacherId,
            headTeacherSignature: null,
            directorSignature: null,
          },
        }),
      ])
      return Response.json({ count: statementCount + bondCount })
    }

    if ((teacher?.delegateFor?.length ?? 0) > 0) {
      // ผู้รับมอบอำนาจเห็นคิวผู้บริหารทั้งสองขั้น (ตรงกับหน้า /dashboard/approve)
      const [statements, bonds] = await Promise.all([
        db.statementRecord.count({ where: { status: { in: ["pending", "pending_director"] } } }),
        db.bondRecord.count({ where: { directorSignature: null, AND: teachersSigned } }),
      ])
      return Response.json({ count: statements + bonds })
    }
  }

  return Response.json({ count: 0 })
}
