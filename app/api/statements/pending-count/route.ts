import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  const role = session?.user?.role
  const teacherId = session?.user?.teacherId

  const isApprover = role === "DIRECTOR" || role === "VICE_DIRECTOR" || role === "ADMIN"

  if (isApprover) {
    const [statements, bonds] = await Promise.all([
      db.statementRecord.count({ where: { status: "pending" } }),
      db.bondRecord.count({
        where: {
          directorSignature: null,
          AND: [
            { OR: [{ headTeacherId: null }, { headTeacherSignature: { not: null } }] },
            { OR: [{ disciplineTeacherId: null }, { disciplineTeacherSignature: { not: null } }] },
          ],
        },
      }),
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
      // นับทั้ง pending_discipline_teacher และ pending_teacher_signatures ที่ตนเองยังไม่ได้ลงนาม
      // รวมถึงทัณฑ์บนที่รอลงนามฝ่ายปกครองด้วย
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
      // นับทั้ง pending_grade_head และ pending_teacher_signatures ที่ตนเองยังไม่ได้ลงนาม
      // รวมถึงทัณฑ์บนที่รอลงนามหัวหน้าระดับด้วย
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
      const [statements, bonds] = await Promise.all([
        db.statementRecord.count({ where: { status: "pending" } }),
        db.bondRecord.count({
          where: {
            directorSignature: null,
            AND: [
              { OR: [{ headTeacherId: null }, { headTeacherSignature: { not: null } }] },
              { OR: [{ disciplineTeacherId: null }, { disciplineTeacherSignature: { not: null } }] },
            ],
          },
        }),
      ])
      return Response.json({ count: statements + bonds })
    }
  }

  return Response.json({ count: 0 })
}
