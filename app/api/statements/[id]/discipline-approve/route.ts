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
    select: { id: true, status: true, disciplineTeacherId: true, gradeHeadTeacherId: true, gradeHeadSignature: true },
  })

  if (!record) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })
  if (record.status !== "pending_discipline_teacher") {
    return Response.json({ error: "ไม่สามารถดำเนินการได้ในสถานะนี้" }, { status: 400 })
  }
  if (record.disciplineTeacherId !== teacherId) {
    return Response.json({ error: "ไม่มีสิทธิ์อนุมัติรายการนี้" }, { status: 403 })
  }

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: { signatureUrl: true },
  })

  // ถ้ามีหัวหน้าระดับที่ดึงจากระบบ → ส่งต่อให้หัวหน้าระดับ, ไม่อย่างนั้น → pending ปกติ
  const isSystemGradeHead = !!record.gradeHeadTeacherId && !record.gradeHeadSignature
  const nextStatus = isSystemGradeHead ? "pending_grade_head" : "pending"

  const updated = await db.statementRecord.update({
    where: { id: Number(id) },
    data: {
      disciplineTeacherSignature: teacher?.signatureUrl || null,
      status: nextStatus,
    },
  })

  return Response.json({ id: updated.id, status: updated.status })
}
