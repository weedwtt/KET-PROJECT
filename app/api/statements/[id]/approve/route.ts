import { NextRequest } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const {
    teacherId,
    signatureTeacherId,
    comment,
    // โหมดรวม: ผู้รับมอบอำนาจอนุมัติทั้งรองผอ.+ผอ. ในครั้งเดียว
    approveBoth,
    viceSignatureTeacherId,
    directorSignatureTeacherId,
    viceComment,
    directorComment,
  } = await req.json()

  if (!teacherId) return Response.json({ error: "กรุณาระบุผู้อนุมัติ" }, { status: 400 })

  const existing = await db.statementRecord.findUnique({ where: { id: Number(id) } })
  if (!existing) return Response.json({ error: "ไม่พบรายการ" }, { status: 404 })

  if (existing.status === "approved") {
    return Response.json({ error: "อนุมัติรายการนี้แล้ว" }, { status: 400 })
  }
  if (existing.status !== "pending" && existing.status !== "pending_director") {
    return Response.json({ error: "ไม่สามารถอนุมัติได้ในสถานะนี้" }, { status: 400 })
  }

  // ── โหมดรวม: อนุมัติทั้งสองขั้น (รองผอ. + ผอ.) ในครั้งเดียว ──
  // ใช้ได้เฉพาะผู้รับมอบอำนาจที่ได้รับมอบทั้งสองตำแหน่ง และรายการต้องอยู่ขั้นแรก (pending)
  if (approveBoth) {
    if (existing.status !== "pending") {
      return Response.json({ error: "ไม่สามารถอนุมัติรวมขั้นได้ในสถานะนี้" }, { status: 400 })
    }
    const viceSignerId = Number(viceSignatureTeacherId)
    const directorSignerId = Number(directorSignatureTeacherId)
    if (!viceSignerId || !directorSignerId) {
      return Response.json({ error: "กรุณาเลือกลายเซ็นทั้งรองผอ. และ ผอ." }, { status: 400 })
    }

    // ตรวจว่า teacherId ได้รับมอบอำนาจจากทั้งสองคนจริง
    const [viceDelegate, directorDelegate] = await Promise.all([
      db.approvalDelegate.findFirst({ where: { delegateId: Number(teacherId), principalId: viceSignerId } }),
      db.approvalDelegate.findFirst({ where: { delegateId: Number(teacherId), principalId: directorSignerId } }),
    ])
    if (!viceDelegate || !directorDelegate) {
      return Response.json({ error: "ไม่มีสิทธิ์อนุมัติในนามบุคคลเหล่านี้" }, { status: 403 })
    }

    const record = await db.statementRecord.update({
      where: { id: Number(id) },
      data: {
        status: "approved",
        approvedByTeacherId: Number(teacherId),
        signatureTeacherId: directorSignerId,
        approvedAt: new Date(),
        viceDirectorComment: viceComment || null,
        directorComment: directorComment || null,
      },
    })
    return Response.json({ id: record.id, status: record.status })
  }

  // Determine effective signer: signatureTeacherId is always the "effective signer"
  // (either the teacher themselves, or a principal they're delegating for)
  const effectiveSignerId = signatureTeacherId ? Number(signatureTeacherId) : Number(teacherId)

  const effectiveSigner = await db.teacher.findUnique({
    where: { id: effectiveSignerId },
    select: { id: true, role: true },
  })

  if (!effectiveSigner) {
    return Response.json({ error: "ไม่พบข้อมูลผู้อนุมัติ" }, { status: 404 })
  }

  // Verify teacherId has permission to use effectiveSignerId's authority
  if (Number(teacherId) !== effectiveSignerId) {
    const delegateRecord = await db.approvalDelegate.findFirst({
      where: { delegateId: Number(teacherId), principalId: effectiveSignerId },
    })
    if (!delegateRecord) {
      return Response.json({ error: "ไม่มีสิทธิ์อนุมัติในนามบุคคลนี้" }, { status: 403 })
    }
  } else {
    // Direct approver - must be DIRECTOR, VICE_DIRECTOR, or ADMIN
    const allowed = ["DIRECTOR", "VICE_DIRECTOR", "ADMIN"]
    if (!effectiveSigner.role || !allowed.includes(effectiveSigner.role)) {
      return Response.json({ error: "ไม่มีสิทธิ์อนุมัติรายการนี้" }, { status: 403 })
    }
  }

  const effectiveRole = effectiveSigner.role

  // Route approval by role and current status
  let nextStatus: string
  if (effectiveRole === "ADMIN") {
    nextStatus = "approved"
  } else if (existing.status === "pending" && effectiveRole === "VICE_DIRECTOR") {
    nextStatus = "pending_director"
  } else if (existing.status === "pending_director" && effectiveRole === "DIRECTOR") {
    nextStatus = "approved"
  } else if (existing.status === "pending" && effectiveRole === "DIRECTOR") {
    return Response.json({ error: "รายการนี้ต้องผ่านการอนุมัติจากรองผู้อำนวยการก่อน" }, { status: 400 })
  } else if (existing.status === "pending_director" && effectiveRole === "VICE_DIRECTOR") {
    return Response.json({ error: "รายการนี้รอผู้อำนวยการอนุมัติ ไม่สามารถดำเนินการได้" }, { status: 400 })
  } else {
    return Response.json({ error: "ไม่มีสิทธิ์อนุมัติรายการนี้" }, { status: 403 })
  }

  // ความเห็น (ไม่บังคับ) — บันทึกลงช่องตามขั้นที่กำลังอนุมัติ
  // ขั้นรองผอ. (pending → pending_director) → viceDirectorComment
  // ขั้นผอ./ADMIN (→ approved)               → directorComment
  const isViceStep = existing.status === "pending" && effectiveRole === "VICE_DIRECTOR"
  const trimmedComment = typeof comment === "string" ? comment.trim() : ""
  const commentData = trimmedComment
    ? isViceStep
      ? { viceDirectorComment: trimmedComment }
      : { directorComment: trimmedComment }
    : {}

  const record = await db.statementRecord.update({
    where: { id: Number(id) },
    data: {
      status: nextStatus,
      ...commentData,
      ...(nextStatus === "approved" ? {
        approvedByTeacherId: Number(teacherId),
        signatureTeacherId: effectiveSignerId,
        approvedAt: new Date(),
      } : {}),
    },
  })

  return Response.json({ id: record.id, status: record.status })
}
