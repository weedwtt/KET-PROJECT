import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Download, Plus, ChevronRight } from "lucide-react"
import { RecentRecordsTable } from "@/components/recent-records-table"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/")

  const isApprover = session.user?.role === "DIRECTOR" || session.user?.role === "VICE_DIRECTOR"

  const [studentCount, statementCount, bondCount, approvedCount, recentRecords] = await Promise.all([
    db.student.count(),
    db.statementRecord.count(),
    db.statementBond.count(),
    db.statementRecord.count({ where: { status: "approved" } }),
    db.statementRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
      include: {
        student: { include: { title: true } },
        violationCategory: true,
      },
    }),
  ])

  const stats = [
    { marker: "01", eyebrow: "STUDENTS", num: studentCount, label: "นักเรียนที่มีบันทึก" },
    { marker: "02", eyebrow: "RECORDS",  num: statementCount, label: "บันทึกถ้อยคำทั้งหมด" },
    { marker: "03", eyebrow: "BONDS",    num: bondCount, label: "สัญญาทัณฑ์บน", neg: true },
    { marker: "04", eyebrow: "APPROVED", num: approvedCount, label: "บันทึกที่อนุมัติแล้ว" },
  ]

  return (
    <div className="ks-page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>ภาพรวม · ระบบบันทึกความประพฤตินักเรียน</span>
          </div>
          <h1>ภาพรวม</h1>
        </div>
        <div className="page-actions">
          <Link href="/dashboard/reports" className="btn btn-secondary">
            <Download size={14} />
            ดาวน์โหลดรายงาน
          </Link>
          {!isApprover && (
            <Link href="/record/statement/new" className="btn btn-primary">
              <Plus size={14} />
              บันทึกใหม่
            </Link>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: "var(--gap-lg)" }}>
        {stats.map((s) => (
          <div key={s.marker} className="stat-card">
            <div className="stat-eyebrow">
              <span>{s.eyebrow}</span>
              <span style={{ color: "var(--ink-4)" }}>{s.marker}</span>
            </div>
            <div className="stat-num" aria-label={`${s.label}: ${s.num}`}>{s.num}</div>
            <div className="stat-label">
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "1.85fr 1fr", gap: "var(--gap)", alignItems: "start" }}>
        {/* Recent records table */}
        <div className="ks-card">
          <div className="ks-card-header">
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>บันทึกล่าสุด</div>
              <div className="ks-card-title">บันทึกถ้อยคำล่าสุด</div>
            </div>
            <Link href="/record/statement" className="btn btn-ghost btn-sm">
              ดูทั้งหมด <ChevronRight size={12} />
            </Link>
          </div>
          <table className="ks-table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>วันที่</th>
                <th style={{ width: 90 }}>รหัส</th>
                <th>ชื่อ-สกุล</th>
                <th>หมวดการผิดระเบียบ</th>
                <th style={{ width: 130 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <RecentRecordsTable rows={recentRecords} />
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          {/* Reminders */}
          <div className="ks-card ks-card-pad">
            <div className="eyebrow" style={{ marginBottom: 14 }}>เตือนความจำ</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 4, alignSelf: "stretch", background: "var(--amber)", borderRadius: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>รายการรออนุมัติ</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    มี {statementCount - approvedCount} รายการที่ยังไม่อนุมัติ
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 4, alignSelf: "stretch", background: "var(--indigo)", borderRadius: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>ติดตามสัญญาทัณฑ์บน</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {bondCount} สัญญาที่ดำเนินการอยู่
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="ks-card ks-card-pad">
            <div className="eyebrow" style={{ marginBottom: 14 }}>สรุปสถานะ</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "รออนุมัติ", value: statementCount - approvedCount, color: "var(--amber)" },
                { label: "อนุมัติแล้ว", value: approvedCount, color: "var(--sage)" },
                { label: "สัญญาทัณฑ์บน", value: bondCount, color: "var(--indigo)" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: "var(--ink-2)" }}>{item.label}</span>
                  <span className="mono" style={{ color: "var(--ink-3)", fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
