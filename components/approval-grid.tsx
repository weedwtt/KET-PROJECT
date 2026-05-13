"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react"

type Statement = {
  id: number
  recordDate: Date
  semester: number
  academicYear: number
  violationCategory: string
  recordedBy: string
  status: string
  student: {
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    title: { name: string }
  }
}

const PAGE_SIZE = 15

export function ApprovalGrid({ data }: { data: Statement[] }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(
      (r) =>
        r.student.studentCode.includes(q) ||
        r.student.firstName.toLowerCase().includes(q) ||
        r.student.lastName.toLowerCase().includes(q) ||
        r.violationCategory.toLowerCase().includes(q)
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const end = Math.min(safePage * PAGE_SIZE, filtered.length)

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })
  }

  return (
    <div>
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="ks-input"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="ค้นหาด้วยรหัสนักเรียน · ชื่อ-สกุล · หมวด"
          />
        </div>
      </div>

      <div className="ks-card" style={{ overflow: "hidden" }}>
        <table className="ks-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>ส่งเมื่อ</th>
              <th>นักเรียน</th>
              <th>หมวดการผิดระเบียบ</th>
              <th>ผู้บันทึก</th>
              <th style={{ width: 130 }}>สถานะ</th>
              <th className="col-actions">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    {search ? "ไม่พบรายการที่ค้นหา" : "ไม่มีรายการที่รออนุมัติ"}
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="clickable" onClick={() => window.location.href = `/dashboard/approve/${row.id}`}>
                  <td>
                    <div className="mono" style={{ fontSize: 13 }}>{formatDate(row.recordDate)}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {row.student.title?.name}{row.student.firstName} {row.student.lastName}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                      {row.student.studentCode} · {row.student.gradeLevel}/{row.student.classRoom}
                    </div>
                  </td>
                  <td>{row.violationCategory}</td>
                  <td style={{ color: "var(--ink-2)" }}>{row.recordedBy}</td>
                  <td><span className="chip chip-pending">รออนุมัติ</span></td>
                  <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/dashboard/approve/${row.id}`} className="btn btn-primary btn-sm">
                      พิจารณา <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span style={{ flex: 1 }}>
            แสดง <span className="mono">{start}–{end}</span> จาก <span className="mono">{filtered.length}</span> รายการ
          </span>
          <button className={`page-btn ${safePage === 1 ? "disabled" : ""}`} onClick={() => safePage > 1 && setPage(safePage - 1)}>
            <ChevronLeft size={12} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn ${p === safePage ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className={`page-btn ${safePage === totalPages ? "disabled" : ""}`} onClick={() => safePage < totalPages && setPage(safePage + 1)}>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
