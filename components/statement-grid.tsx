"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from "lucide-react"

type Statement = {
  id: number
  recordDate: Date
  semester: number
  academicYear: number
  violationCategory: string
  status: string
  student: {
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    title: { name: string }
  }
  studentSignature: string | null
  guardianSignature: string | null
  advisorSignature: string | null
  disciplineTeacherSignature: string | null
  gradeHeadSignature: string | null
  considerationMeasures: string[]
  approvedAt: Date | null
}

interface StatementGridProps {
  data: Statement[]
  total: number
  page: number
  totalPages: number
  search: string
  pageSize: number
}

export function StatementGrid({ data, total, page, totalPages, search: initialSearch, pageSize }: StatementGridProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(initialSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (confirmDeleteId === null) return
    setDeleting(true)
    try {
      await fetch(`/api/statements/${confirmDeleteId}`, { method: "DELETE" })
      setConfirmDeleteId(null)
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  function navigate(newPage: number, newSearch: string) {
    const params = new URLSearchParams()
    if (newSearch) params.set("search", newSearch)
    if (newPage > 1) params.set("page", String(newPage))
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ""}`)
    router.refresh()
  }

  function onSearchChange(val: string) {
    setSearchValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(1, val), 400)
  }

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="ks-input"
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาด้วยรหัสนักเรียน · ชื่อ-สกุล · หมวดการผิดระเบียบ"
          />
        </div>
      </div>

      {/* Table */}
      <div className="ks-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
        <table className="ks-table" style={{ tableLayout: "fixed", width: "100%", minWidth: 1020 }}>
          <colgroup>
            <col style={{ width: 112 }} />
            <col style={{ width: 210 }} />
            <col style={{ width: 185 }} />
            <col style={{ width: 62 }} /><col style={{ width: 62 }} /><col style={{ width: 66 }} /><col style={{ width: 74 }} /><col style={{ width: 68 }} /><col style={{ width: 62 }} />
            <col style={{ width: 118 }} />
            <col style={{ width: 82 }} />
          </colgroup>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>นักเรียน</th>
              <th>หมวดการผิดระเบียบ</th>
              <th style={{ textAlign: "center", fontSize: 11, whiteSpace: "normal", lineHeight: 1.35 }}>นักเรียน</th>
              <th style={{ textAlign: "center", fontSize: 11, whiteSpace: "normal", lineHeight: 1.35 }}>ผู้ปกครอง</th>
              <th style={{ textAlign: "center", fontSize: 11, whiteSpace: "normal", lineHeight: 1.35 }}>ครูที่ปรึกษา</th>
              <th style={{ textAlign: "center", fontSize: 11, whiteSpace: "normal", lineHeight: 1.35 }}>ครูฝ่ายปกครอง</th>
              <th style={{ textAlign: "center", fontSize: 11, whiteSpace: "normal", lineHeight: 1.35 }}>หัวหน้าระดับ</th>
              <th style={{ textAlign: "center", fontSize: 11, whiteSpace: "normal", lineHeight: 1.35 }}>ผอ./รองผอ.</th>
              <th>สถานะ</th>
              <th className="col-actions">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <div className="empty-state">
                    {searchValue ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีรายการบันทึกถ้อยคำ"}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const guardianDisabled =
                  row.considerationMeasures.includes("notify_parent") &&
                  !row.considerationMeasures.includes("invite_parent")
                return (
                <tr key={row.id}>
                  <td>
                    <div className="mono" style={{ fontSize: 13 }}>{formatDate(row.recordDate)}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      {row.semester}/{row.academicYear}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {row.student.title?.name}{row.student.firstName} {row.student.lastName}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                      {row.student.studentCode} · {row.student.gradeLevel}/{row.student.classRoom}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--ink-2)" }}>{row.violationCategory}</td>
                  <td style={{ textAlign: "center" }}>
                    <SigDot signed={!!row.studentSignature} label="นักเรียน" />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <SigDot signed={!!row.guardianSignature} label="ผู้ปกครอง" disabled={guardianDisabled} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <SigDot signed={!!row.advisorSignature} label="ครูที่ปรึกษา" />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <SigDot signed={!!row.disciplineTeacherSignature} label="ครูฝ่ายปกครอง" />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <SigDot signed={!!row.gradeHeadSignature} label="หัวหน้าระดับ" />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <SigDot signed={!!row.approvedAt} label="ผอ./รองผอ." />
                  </td>
                  <td>
                    <span className={`chip chip-${row.status === "approved" ? "approved" : "pending"}`}>
                      {row.status === "approved" ? "อนุมัติแล้ว"
                        : row.status === "pending_teacher_signatures" ? "รอลงนาม 2 ฝ่าย"
                        : row.status === "pending_discipline_teacher" ? "รอฝ่ายปกครอง"
                        : row.status === "pending_grade_head" ? "รอหัวหน้าระดับ"
                        : "รออนุมัติ"}
                    </span>
                  </td>
                  <td className="col-actions" style={{ paddingRight: 20 }}>
                    <Link href={`/record/statement/${row.id}`} className="btn btn-ghost btn-sm btn-icon" title="ดู">
                      <Eye size={14} />
                    </Link>
                    {row.status !== "approved" && (
                      <Link href={`/record/statement/${row.id}/edit`} className="btn btn-ghost btn-sm btn-icon" title="แก้ไข">
                        <Pencil size={14} />
                      </Link>
                    )}
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      title="ลบ"
                      style={{ color: "var(--rose)" }}
                      onClick={() => setConfirmDeleteId(row.id)}
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
        </div>

        {/* Pagination */}
        <div className="pagination">
          <span style={{ flex: 1 }}>
            แสดง <span className="mono">{start}–{end}</span> จาก <span className="mono">{total}</span> รายการ
          </span>
          <button
            className={`page-btn ${page === 1 ? "disabled" : ""}`}
            onClick={() => page > 1 && navigate(page - 1, searchValue)}
          >
            <ChevronLeft size={12} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`page-btn ${p === page ? "active" : ""}`}
              onClick={() => navigate(p, searchValue)}
            >
              {p}
            </button>
          ))}
          <button
            className={`page-btn ${page === totalPages ? "disabled" : ""}`}
            onClick={() => page < totalPages && navigate(page + 1, searchValue)}
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Signature status legend */}
      <div style={{ padding: "8px 16px 4px", display: "flex", gap: 16, fontSize: 11, color: "var(--ink-3)", borderTop: "1px solid var(--rule)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--sage, #22c55e)", display: "inline-block" }} />
          เซ็น/อนุมัติแล้ว
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          รอเซ็น/อนุมัติ
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#d1d5db", opacity: 0.4, display: "inline-block" }} />
          ไม่จำเป็น
        </span>
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
                บันทึกถ้อยคำ <span className="mono">#{confirmDeleteId}</span> จะถูกลบถาวรและไม่สามารถกู้คืนได้
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

function SigDot({ signed, label, disabled = false }: { signed: boolean; label: string; disabled?: boolean }) {
  const color = disabled ? "#d1d5db" : signed ? "var(--sage, #22c55e)" : "#f59e0b"
  const title = disabled
    ? `${label} (ไม่จำเป็น)`
    : signed
    ? `${label} · เซ็น/อนุมัติแล้ว`
    : `${label} · รอเซ็น/อนุมัติ`
  return (
    <span
      title={title}
      style={{
        width: 12, height: 12, borderRadius: "50%",
        background: color,
        opacity: disabled ? 0.35 : 1,
        display: "inline-block",
        cursor: "default",
      }}
    />
  )
}
