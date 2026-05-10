import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { TeacherRole } from "@/lib/generated/prisma/client"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { teacherId } = await req.json()

  if (!teacherId) return Response.json({ error: "กรุณาระบุผู้อนุมัติ" }, { status: 400 })

  const existing = await db.statementRecord.findUnique({ where: { id: Number(id) } })
  if (!existing) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })
  if (existing.status === "approved") {
    return Response.json({ error: "อนุมัติรายการนี้แล้ว" }, { status: 400 })
  }

  const teacher = await db.teacher.findFirst({
    where: { id: Number(teacherId), role: { in: [TeacherRole.DIRECTOR, TeacherRole.VICE_DIRECTOR] } },
  })
  if (!teacher) return Response.json({ error: "ไม่พบครูที่มีสิทธิ์อนุมัติ" }, { status: 403 })

  const record = await db.statementRecord.update({
    where: { id: Number(id) },
    data: {
      status: "approved",
      approvedByTeacherId: Number(teacherId),
      approvedAt: new Date(),
    },
  })

  return Response.json({ id: record.id, status: record.status })
}
