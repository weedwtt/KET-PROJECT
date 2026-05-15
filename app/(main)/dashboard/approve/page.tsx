import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ApprovalGrid } from "@/components/approval-grid"

async function getPendingStatements() {
  try {
    const rows = await db.statementRecord.findMany({
      where: { status: "pending" },
      include: {
        student: {
          select: {
            studentCode: true,
            firstName: true,
            lastName: true,
            gradeLevel: true,
            classRoom: true,
            title: { select: { name: true } },
          },
        },
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

export default async function ApprovePage() {
  const session = await auth()
  const role = session?.user?.role

  if (role !== "DIRECTOR" && role !== "VICE_DIRECTOR" && role !== "ADMIN") redirect("/dashboard")

  const statements = await getPendingStatements()

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
          { marker: "01", eyebrow: "QUEUE", num: statements.length, label: "ทั้งหมดที่รอ" },
          { marker: "02", eyebrow: "TODAY", num: "—", label: "รอจากวันนี้" },
          { marker: "03", eyebrow: "OVERDUE", num: "—", label: "เกินกำหนด (>24 ชม.)" },
          { marker: "04", eyebrow: "MY ROLE", num: role === "DIRECTOR" ? "ผอ." : "รองผอ.", label: "ระดับการอนุมัติ" },
        ].map((s) => (
          <div key={s.marker} className="stat-card">
            <div className="stat-eyebrow"><span>{s.eyebrow}</span><span style={{ color: "var(--ink-4)" }}>{s.marker}</span></div>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label"><span>{s.label}</span></div>
          </div>
        ))}
      </div>

      <ApprovalGrid data={statements} />
    </div>
  )
}
