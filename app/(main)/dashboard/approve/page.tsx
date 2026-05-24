import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ApprovalGrid } from "@/components/approval-grid"

const STUDENT_SELECT = {
  studentCode: true,
  firstName: true,
  lastName: true,
  gradeLevel: true,
  classRoom: true,
  title: { select: { name: true } },
} as const

async function getPendingStatements() {
  try {
    const rows = await db.statementRecord.findMany({
      where: { status: "pending" },
      include: {
        student: { select: STUDENT_SELECT },
        semester: { select: { value: true } },
        academicYear: { select: { year: true } },
        violationCategory: { select: { name: true } },
      },
      orderBy: { recordDate: "desc" },
    })
    return rows.map((r) => ({
      id: r.id,
      recordDate: r.recordDate,
      recordedBy: r.recordedBy,
      semester: r.semester.value,
      academicYear: r.academicYear.year,
      violationCategory: r.violationCategory.name,
      status: r.status,
      student: r.student,
    }))
  } catch {
    return []
  }
}

async function getGradeHeadPendingStatements(teacherId: number) {
  try {
    const rows = await db.statementRecord.findMany({
      where: { status: "pending_grade_head", gradeHeadTeacherId: teacherId },
      include: {
        student: { select: STUDENT_SELECT },
        semester: { select: { value: true } },
        academicYear: { select: { year: true } },
        violationCategory: { select: { name: true } },
      },
      orderBy: { recordDate: "desc" },
    })
    return rows.map((r) => ({
      id: r.id,
      recordDate: r.recordDate,
      recordedBy: r.recordedBy,
      semester: r.semester.value,
      academicYear: r.academicYear.year,
      violationCategory: r.violationCategory.name,
      status: r.status,
      student: r.student,
    }))
  } catch {
    return []
  }
}

async function getPendingBonds() {
  try {
    const rows = await db.bondRecord.findMany({
      where: { directorSignature: null },
      select: {
        id: true,
        contractDate: true,
        guardianName: true,
        recorder: true,
        viceDirectorSignature: true,
        student: { select: STUDENT_SELECT },
        semester: { select: { value: true } },
        academicYear: { select: { year: true } },
      },
      orderBy: { contractDate: "desc" },
    })
    return rows.map((r) => ({
      ...r,
      contractDate: r.contractDate.toISOString(),
      semester: r.semester ?? null,
      academicYear: r.academicYear ?? null,
    }))
  } catch {
    return []
  }
}

export default async function ApprovePage() {
  const session = await auth()
  const role = session?.user?.role
  const teacherId = session?.user?.teacherId

  const isApprover = role === "DIRECTOR" || role === "VICE_DIRECTOR" || role === "ADMIN"

  let isDelegate = false
  let isGradeHead = false

  if (!isApprover && teacherId) {
    const [delegateCount, teacher] = await Promise.all([
      db.approvalDelegate.count({ where: { delegateId: teacherId } }),
      db.teacher.findUnique({ where: { id: teacherId }, select: { gradeHeadLevel: true } }),
    ])
    isDelegate = delegateCount > 0
    isGradeHead = !!teacher?.gradeHeadLevel
  }

  if (!isApprover && !isDelegate && !isGradeHead) redirect("/dashboard")

  const myRoleLabel =
    isGradeHead && !isApprover && !isDelegate ? "หัวหน้าระดับ" :
    role === "DIRECTOR" ? "ผอ." :
    role === "VICE_DIRECTOR" ? "รองผอ." :
    role === "ADMIN" ? "admin" :
    "ผู้รับมอบอำนาจ"

  const showDirectorQueue = isApprover || isDelegate

  const [statements, bonds, gradeHeadPending] = await Promise.all([
    showDirectorQueue ? getPendingStatements() : Promise.resolve([]),
    showDirectorQueue ? getPendingBonds() : Promise.resolve([]),
    isGradeHead && teacherId ? getGradeHeadPendingStatements(teacherId) : Promise.resolve([]),
  ])

  const totalQueue = showDirectorQueue
    ? statements.length + bonds.length
    : gradeHeadPending.length

  return (
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>ฝ่ายปกครอง · รายการรออนุมัติ</span>
          </div>
          <h1>รออนุมัติ</h1>
        </div>
      </div>

      {/* Mini stat row */}
      <div className="grid-4" style={{ marginBottom: "var(--gap-lg)" }}>
        {[
          { marker: "01", eyebrow: "QUEUE", num: totalQueue, label: "ทั้งหมดที่รอ" },
          { marker: "02", eyebrow: "TODAY", num: "—", label: "รอจากวันนี้" },
          { marker: "03", eyebrow: "OVERDUE", num: "—", label: "เกินกำหนด (>24 ชม.)" },
          { marker: "04", eyebrow: "MY ROLE", num: myRoleLabel, label: "ระดับการอนุมัติ" },
        ].map((s) => (
          <div key={s.marker} className="stat-card">
            <div className="stat-eyebrow"><span>{s.eyebrow}</span><span style={{ color: "var(--ink-4)" }}>{s.marker}</span></div>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label"><span>{s.label}</span></div>
          </div>
        ))}
      </div>

      {showDirectorQueue ? (
        <ApprovalGrid data={statements} bonds={bonds} />
      ) : (
        <ApprovalGrid data={gradeHeadPending} bonds={[]} />
      )}
    </div>
  )
}
