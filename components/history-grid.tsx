"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react"

type HistoryRow = {
  id: number
  recordDate: string
  semester: number
  academicYear: number
  violationCategory: string
  student: {
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    title: { name: string }
  }
  approvedByTeacher: {
    firstName: string
    lastName: string
    title: { name: string }
  } | null
}

interface HistoryGridProps {
  data: HistoryRow[]
  total: number
  page: number
  totalPages: number
  search: string
  pageSize: number
}

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]

function formatThaiDate(isoStr: string) {
  const dt = new Date(isoStr)
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543}`
}

export function HistoryGrid({ data, total, page, totalPages, search: initialSearch, pageSize }: HistoryGridProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(initialSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function navigate(newPage: number, newSearch: string) {
    const params = new URLSearchParams()
    if (newSearch) params.set("search", newSearch)
    if (newPage > 1) params.set("page", String(newPage))
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`)
  }

  function onSearchChange(val: string) {
    setSearchValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(1, val), 400)
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div>
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="ks-input"
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาในประวัติ"
          />
        </div>
      </div>

      <div className="ks-card" style={{ overflow: "hidden" }}>
        <table className="ks-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>วันที่</th>
              <th>นักเรียน</th>
              <th>หมวดการผิดระเบียบ</th>
              <th>อนุมัติโดย</th>
              <th style={{ width: 130 }}>สถานะ</th>
              <th className="col-actions">ดู</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    {searchValue ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีรายการที่อนุมัติแล้ว"}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="mono" style={{ fontSize: 13 }}>{formatThaiDate(row.recordDate)}</div>
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
                  <td>{row.violationCategory}</td>
                  <td style={{ color: "var(--ink-2)" }}>
                    {row.approvedByTeacher
                      ? `${row.approvedByTeacher.title?.name}${row.approvedByTeacher.firstName} ${row.approvedByTeacher.lastName}`
                      : "—"}
                  </td>
                  <td><span className="chip chip-approved">อนุมัติแล้ว</span></td>
                  <td className="col-actions">
                    <Link href={`/record/statement/${row.id}`} className="btn btn-ghost btn-sm btn-icon" title="ดูรายละเอียด">
                      <Eye size={14} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span style={{ flex: 1 }}>
            แสดง <span className="mono">{start}–{end}</span> จาก <span className="mono">{total}</span> รายการ
          </span>
          <button className={`page-btn ${page === 1 ? "disabled" : ""}`} onClick={() => page > 1 && navigate(page - 1, searchValue)}>
            <ChevronLeft size={12} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => navigate(p, searchValue)}>{p}</button>
          ))}
          <button className={`page-btn ${page === totalPages ? "disabled" : ""}`} onClick={() => page < totalPages && navigate(page + 1, searchValue)}>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
