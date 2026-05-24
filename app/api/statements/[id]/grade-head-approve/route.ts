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
    select: { id: true, status: true, gradeHeadTeacherId: true },
  })

  if (!record) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })
  if (record.status !== "pending_grade_head") {
    return Response.json({ error: "ไม่สามารถดำเนินการได้ในสถานะนี้" }, { status: 400 })
  }
  if (record.gradeHeadTeacherId !== teacherId) {
    return Response.json({ error: "ไม่มีสิทธิ์อนุมัติรายการนี้" }, { status: 403 })
  }

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: { signatureUrl: true },
  })

  const updated = await db.statementRecord.update({
    where: { id: Number(id) },
    data: {
      gradeHeadSignature: teacher?.signatureUrl || null,
      status: "pending",
    },
  })

  return Response.json({ id: updated.id, status: updated.status })
}
