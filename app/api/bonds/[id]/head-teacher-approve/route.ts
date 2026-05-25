import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const teacherId = session?.user?.teacherId

  if (!teacherId) {
    return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 })
  }

  const record = await db.bondRecord.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      headTeacherId: true,
      headTeacherSignature: true,
      directorSignature: true,
    },
  })

  if (!record) {
    return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })
  }

  if (record.headTeacherId !== teacherId) {
    return Response.json({ error: "ไม่มีสิทธิ์ลงนามรายการนี้" }, { status: 403 })
  }

  if (record.headTeacherSignature) {
    return Response.json({ error: "ลงนามแล้ว" }, { status: 409 })
  }

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: { signatureUrl: true },
  })

  const sigToUse = teacher?.signatureUrl ?? "signed"

  await db.bondRecord.update({
    where: { id: Number(id) },
    data: { headTeacherSignature: sigToUse },
  })

  return Response.json({ ok: true })
}
