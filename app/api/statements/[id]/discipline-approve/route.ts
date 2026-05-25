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
      disciplineTeacherId: true,
      gradeHeadTeacherId: true,
      gradeHeadSignature: true,
    },
  })

  if (!record) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })

  const allowedStatuses = ["pending_discipline_teacher", "pending_teacher_signatures"]
  if (!allowedStatuses.includes(record.status)) {
    return Response.json({ error: "ไม่สามารถดำเนินการได้ในสถานะนี้" }, { status: 400 })
  }
  if (record.disciplineTeacherId !== teacherId) {
    return Response.json({ error: "ไม่มีสิทธิ์อนุมัติรายการนี้" }, { status: 403 })
  }

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: { signatureUrl: true },
  })

  // หลังฝ่ายปกครองลงนามแล้ว ตรวจสอบว่าหัวหน้าระดับลงนามแล้วหรือยัง
  // ถ้า pending_teacher_signatures และหัวหน้าระดับยังไม่ได้ลงนาม → คงสถานะรอหัวหน้าระดับ
  // ถ้าหัวหน้าระดับลงนามแล้ว หรือไม่มีหัวหน้าระดับจากระบบ → ส่งต่อ pending
  const gradeHeadAlreadySigned = !!record.gradeHeadSignature
  const hasSystemGradeHead = !!record.gradeHeadTeacherId
  const nextStatus = (record.status === "pending_teacher_signatures" && hasSystemGradeHead && !gradeHeadAlreadySigned)
    ? "pending_teacher_signatures"
    : "pending"

  const updated = await db.statementRecord.update({
    where: { id: Number(id) },
    data: {
      disciplineTeacherSignature: teacher?.signatureUrl || null,
      status: nextStatus,
    },
  })

  return Response.json({ id: updated.id, status: updated.status })
}
