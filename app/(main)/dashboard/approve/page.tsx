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

async function getPendingStatements(role: string | undefined) {
  try {
    // VICE_DIRECTOR sees pending (รอรองผอ), DIRECTOR sees pending_director (รอผอ)
    // ADMIN and delegates see both
    const statuses =
      role === "VICE_DIRECTOR" ? ["pending"]
      : role === "DIRECTOR" ? ["pending_director"]
      : ["pending", "pending_director"]

    const rows = await db.statementRecord.findMany({
      where: { status: { in: statuses } },
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
      where: {
        status: { in: ["pending_grade_head", "pending_teacher_signatures"] },
        gradeHeadTeacherId: teacherId,
        gradeHeadSignature: null,
      },
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

async function getDisciplineTeacherPendingStatements(teacherId: number) {
  try {
    const rows = await db.statementRecord.findMany({
      where: {
        status: { in: ["pending_discipline_teacher", "pending_teacher_signatures"] },
        disciplineTeacherId: teacherId,
        disciplineTeacherSignature: null,
      },
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

async function getPendingBonds(role: string | undefined) {
  try {
    const teachersSigned = [
      { OR: [{ headTeacherId: null }, { headTeacherSignature: { not: null } }] },
      { OR: [{ disciplineTeacherId: null }, { disciplineTeacherSignature: { not: null } }] },
    ]
    // VICE_DIRECTOR: รอรองผอลงนาม (viceDirectorSignature ยังไม่มี)
    // DIRECTOR: รองผอลงนามแล้ว รอผอ
    // ADMIN/delegate: เห็นทั้งหมดที่ directorSignature ยังไม่มี
    const where =
      role === "VICE_DIRECTOR"
        ? { viceDirectorSignature: null, directorSignature: null, AND: teachersSigned }
        : role === "DIRECTOR"
        ? { viceDirectorSignature: { not: null }, directorSignature: null, AND: teachersSigned }
        : { directorSignature: null, AND: teachersSigned }

    const rows = await db.bondRecord.findMany({
      where,
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

async function getDisciplinePendingBonds(teacherId: number) {
  try {
    const rows = await db.bondRecord.findMany({
      where: {
        disciplineTeacherId: teacherId,
        disciplineTeacherSignature: null,
        directorSignature: null,
      },
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

async function getHeadTeacherPendingBonds(teacherId: number) {
  try {
    const rows = await db.bondRecord.findMany({
      where: {
        headTeacherId: teacherId,
        headTeacherSignature: null,
        directorSignature: null,
      },
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
  let isDisciplineTeacher = false

  if (!isApprover && teacherId) {
    const [delegateCount, teacher] = await Promise.all([
      db.approvalDelegate.count({ where: { delegateId: teacherId } }),
      db.teacher.findUnique({ where: { id: teacherId }, select: { gradeHeadLevel: true, role: true } }),
    ])
    isDelegate = delegateCount > 0
    isGradeHead = !!teacher?.gradeHeadLevel
    isDisciplineTeacher = teacher?.role === "DISCIPLINE"
  }

  if (!isApprover && !isDelegate && !isGradeHead && !isDisciplineTeacher) redirect("/dashboard")

  const myRoleLabel =
    isDisciplineTeacher && !isApprover && !isDelegate ? "ครูฝ่ายปกครอง" :
    isGradeHead && !isApprover && !isDelegate ? "หัวหน้าระดับ" :
    role === "DIRECTOR" ? "ผอ." :
    role === "VICE_DIRECTOR" ? "รองผอ." :
    role === "ADMIN" ? "admin" :
    "ผู้รับมอบอำนาจ"

  const showDirectorQueue = isApprover || isDelegate

  const [statements, bonds, gradeHeadPending, disciplinePending, disciplinePendingBonds, gradeHeadPendingBonds] = await Promise.all([
    showDirectorQueue ? getPendingStatements(role ?? undefined) : Promise.resolve([]),
    showDirectorQueue ? getPendingBonds(role ?? undefined) : Promise.resolve([]),
    isGradeHead && teacherId ? getGradeHeadPendingStatements(teacherId) : Promise.resolve([]),
    isDisciplineTeacher && teacherId ? getDisciplineTeacherPendingStatements(teacherId) : Promise.resolve([]),
    isDisciplineTeacher && teacherId ? getDisciplinePendingBonds(teacherId) : Promise.resolve([]),
    isGradeHead && teacherId ? getHeadTeacherPendingBonds(teacherId) : Promise.resolve([]),
  ])

  const myPending = isDisciplineTeacher ? disciplinePending : gradeHeadPending
  const myPendingBonds = isDisciplineTeacher ? disciplinePendingBonds : gradeHeadPendingBonds
  const totalQueue = showDirectorQueue
    ? statements.length + bonds.length
    : myPending.length + myPendingBonds.length

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
        ].map((s) => {
          const isText = typeof s.num === "string" && s.num.length > 4
          return (
            <div key={s.marker} className="stat-card">
              <div className="stat-eyebrow"><span>{s.eyebrow}</span><span style={{ color: "var(--ink-4)" }}>{s.marker}</span></div>
              <div
                className="stat-num"
                style={isText ? { fontSize: 20, fontFamily: "var(--font-sans)", letterSpacing: "normal", marginTop: 16, marginBottom: 8 } : undefined}
              >
                {s.num}
              </div>
              <div className="stat-label"><span>{s.label}</span></div>
            </div>
          )
        })}
      </div>

      {showDirectorQueue ? (
        <ApprovalGrid data={statements} bonds={bonds} />
      ) : (
        <ApprovalGrid data={myPending} bonds={myPendingBonds} />
      )}
    </div>
  )
}
