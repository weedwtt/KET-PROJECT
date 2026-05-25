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
      db.bondRecord.count({ where: { directorSignature: null } }),
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
      const count = await db.statementRecord.count({
        where: { status: "pending_discipline_teacher", disciplineTeacherId: teacherId },
      })
      return Response.json({ count })
    }

    if (teacher?.gradeHeadLevel) {
      const count = await db.statementRecord.count({
        where: { status: "pending_grade_head", gradeHeadTeacherId: teacherId },
      })
      return Response.json({ count })
    }

    if ((teacher?.delegateFor?.length ?? 0) > 0) {
      const [statements, bonds] = await Promise.all([
        db.statementRecord.count({ where: { status: "pending" } }),
        db.bondRecord.count({ where: { directorSignature: null } }),
      ])
      return Response.json({ count: statements + bonds })
    }
  }

  return Response.json({ count: 0 })
}
