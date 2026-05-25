import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.teacherId) {
    return Response.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 })
  }

  const teacherId = session.user.teacherId
  const { id } = await params

  const record = await db.statementRecord.findUnique({
    where: { id: Number(id) },
    select: {
      id: true, status: true,
      gradeHeadTeacherId: true,
      disciplineTeacherId: true,
      disciplineTeacherSignature: true,
    },
  })

  if (!record) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })

  const allowedStatuses = ["pending_grade_head", "pending_teacher_signatures"]
  if (!allowedStatuses.includes(record.status)) {
    return Response.json({ error: "ไม่สามารถดำเนินการได้ในสถานะนี้" }, { status: 400 })
  }
  if (record.gradeHeadTeacherId !== teacherId) {
    return Response.json({ error: "ไม่มีสิทธิ์อนุมัติรายการนี้" }, { status: 403 })
  }

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: { signatureUrl: true },
  })

  // หลังหัวหน้าระดับลงนามแล้ว ตรวจสอบว่าฝ่ายปกครองลงนามแล้วหรือยัง
  // ถ้า pending_teacher_signatures และฝ่ายปกครองยังไม่ได้ลงนาม → คงสถานะรอฝ่ายปกครอง
  // ถ้าฝ่ายปกครองลงนามแล้ว หรือไม่มีฝ่ายปกครองจากระบบ → ส่งต่อ pending
  const disciplineAlreadySigned = !!record.disciplineTeacherSignature
  const hasSystemDiscipline = !!record.disciplineTeacherId
  const nextStatus = (record.status === "pending_teacher_signatures" && hasSystemDiscipline && !disciplineAlreadySigned)
    ? "pending_teacher_signatures"
    : "pending"

  const updated = await db.statementRecord.update({
    where: { id: Number(id) },
    data: {
      gradeHeadSignature: teacher?.signatureUrl || null,
      status: nextStatus,
    },
  })

  return Response.json({ id: updated.id, status: updated.status })
}
