"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Search, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

type BondStudent = {
  studentCode: string
  firstName: string
  lastName: string
  gradeLevel: string
  classRoom: number
  title: { name: string }
}

type BondRecord = {
  id: number
  contractDate: string
  guardianName: string
  guardianRelation: string
  violationDetail: string
  status: string
  recorder: string
  measureDeductScore: boolean
  measureDeductPoints: number | null
  measureActivity: boolean
  measureSuspension: boolean
  measureTransfer: boolean
  guardianSignature: string | null
  studentSignature: string | null
  advisorSignature: string | null
  headTeacher: { id: number; firstName: string; lastName: string; title: { name: string } } | null
  disciplineTeacher: { id: number; firstName: string; lastName: string; title: { name: string } } | null
  viceDirectorSignature: string | null
  directorSignature: string | null
  student: BondStudent
  semester: { value: number } | null
  academicYear: { year: number } | null
}


function formatThaiDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
}


export default function BondListPage() {
  const [q, setQ] = useState("")
  const [records, setRecords] = useState<BondRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (confirmDeleteId === null) return
    setDeleting(true)
    try {
      await fetch(`/api/bonds/${confirmDeleteId}`, { method: "DELETE" })
      setConfirmDeleteId(null)
      load(q, page)
    } finally {
      setDeleting(false)
    }
  }

  const load = useCallback(async (search: string, p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bonds?q=${encodeURIComponent(search)}&page=${p}`)
      const data = await res.json()
      setRecords(data.records ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(q, page) }, [load, q, page])

  function onSearchChange(val: string) {
    setQ(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      load(val, 1)
    }, 400)
  }

  return (
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">บันทึกข้อมูล</div>
          <h1>บันทึกทัณฑ์บน</h1>
        </div>
        <Link href="/record/bond/new" className="btn btn-primary">
          <Plus size={15} /> สร้างสัญญาใหม่
        </Link>
      </div>

      {/* Search */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="ks-input"
            type="text"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาด้วยชื่อนักเรียน รหัส หรือชื่อผู้ปกครอง"
          />
        </div>
      </div>

      {/* Table */}
      <div className="ks-card" style={{ overflow: "hidden" }}>
        <table className="ks-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>นักเรียน</th>
              <th>ผู้ปกครอง</th>
              <th>มาตรการ</th>
              <th>สถานะ</th>
              <th className="col-actions">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">กำลังโหลด...</div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    {q ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีบันทึกทัณฑ์บน"}
                  </div>
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const measures: string[] = []
                if (r.measureDeductScore) measures.push(`ตัดคะแนน${r.measureDeductPoints ? ` ${r.measureDeductPoints}` : ""}`)
                if (r.measureActivity) measures.push("กิจกรรม")
                if (r.measureSuspension) measures.push("พักเรียน")
                if (r.measureTransfer) measures.push("ย้าย")

                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{formatThaiDate(r.contractDate)}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        {r.semester && r.academicYear ? `${r.semester.value}/${r.academicYear.year}` : "—"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>
                        {r.student.title.name}{r.student.firstName} {r.student.lastName}
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        {r.student.studentCode} · {r.student.gradeLevel}/{r.student.classRoom}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13.5 }}>{r.guardianName}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{r.guardianRelation}</div>
                    </td>
                    <td>
                      {measures.length === 0 ? (
                        <span style={{ color: "var(--ink-4)", fontSize: 13 }}>—</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {measures.map((m) => (
                            <span key={m} className="measure-tag" style={{ fontSize: 11 }}>
                              <span className="dot" />{m}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`chip chip-${r.directorSignature ? "approved" : "pending"}`}>
                        {r.directorSignature ? "อนุมัติแล้ว" : "รออนุมัติ"}
                      </span>
                    </td>
                    <td className="col-actions">
                      <Link href={`/record/bond/${r.id}`} className="btn btn-ghost btn-sm btn-icon" title="ดู">
                        <Eye size={14} />
                      </Link>
                      {!r.directorSignature && (
                        <Link href={`/record/bond/${r.id}/edit`} className="btn btn-ghost btn-sm btn-icon" title="แก้ไข">
                          <Pencil size={14} />
                        </Link>
                      )}
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="ลบ"
                        style={{ color: "var(--rose)" }}
                        onClick={() => setConfirmDeleteId(r.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span style={{ flex: 1 }}>
            แสดง <span className="mono">{total === 0 ? 0 : (page - 1) * 15 + 1}–{Math.min(page * 15, total)}</span> จาก <span className="mono">{total}</span> รายการ
          </span>
          <button className={`page-btn ${page === 1 ? "disabled" : ""}`} onClick={() => page > 1 && setPage(page - 1)}>
            <ChevronLeft size={12} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className={`page-btn ${page === totalPages ? "disabled" : ""}`} onClick={() => page < totalPages && setPage(page + 1)}>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDeleteId !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div className="ks-card" style={{ width: 360, padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>ยืนยันการลบ</div>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
                บันทึกทัณฑ์บน <span className="mono">BK-{String(confirmDeleteId).padStart(4, "0")}</span> จะถูกลบถาวรและไม่สามารถกู้คืนได้
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                style={{ background: "var(--rose)", borderColor: "var(--rose)", opacity: deleting ? 0.6 : 1 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
