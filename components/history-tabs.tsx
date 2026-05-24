"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react"

type Student = {
  studentCode: string
  firstName: string
  lastName: string
  gradeLevel: string
  classRoom: number
  title: { name: string }
}

type Teacher = {
  firstName: string
  lastName: string
  title: { name: string }
} | null

type StatementRow = {
  id: number
  recordDate: string
  semester: number
  academicYear: number
  violationCategory: string
  student: Student
  approvedByTeacher: Teacher
}

type BondRow = {
  id: number
  contractDate: string
  semester: number | null
  academicYear: number | null
  guardianName: string
  guardianRelation: string
  measureDeductScore: boolean
  measureDeductPoints: number | null
  measureActivity: boolean
  measureSuspension: boolean
  measureTransfer: boolean
  student: Student
  approvedByTeacher: Teacher
}

type Tab = "statement" | "bond"

interface HistoryTabsProps {
  tab: Tab
  statements: StatementRow[]
  bonds: BondRow[]
  statementCount: number
  bondCount: number
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

function teacherName(t: Teacher) {
  return t ? `${t.title?.name}${t.firstName} ${t.lastName}` : "—"
}

const TABS: { id: Tab; label: string }[] = [
  { id: "statement", label: "รายการบันทึกถ้อยคำ" },
  { id: "bond", label: "รายการทัณฑ์บน" },
]

export function HistoryTabs({
  tab,
  statements,
  bonds,
  statementCount,
  bondCount,
  total,
  page,
  totalPages,
  search: initialSearch,
  pageSize,
}: HistoryTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(initialSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function navigate(newTab: Tab, newPage: number, newSearch: string) {
    const params = new URLSearchParams()
    if (newTab === "bond") params.set("tab", "bond")
    if (newSearch) params.set("search", newSearch)
    if (newPage > 1) params.set("page", String(newPage))
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`)
    router.refresh()
  }

  function switchTab(newTab: Tab) {
    if (newTab === tab) return
    setSearchValue("")
    navigate(newTab, 1, "")
  }

  function onSearchChange(val: string) {
    setSearchValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(tab, 1, val), 400)
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 20,
          borderBottom: "2px solid var(--surface-2)",
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id
          const count = t.id === "statement" ? statementCount : bondCount
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              style={{
                padding: "10px 22px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--indigo)" : "var(--ink-3)",
                borderBottom: active ? "2px solid var(--indigo)" : "2px solid transparent",
                marginBottom: -2,
                transition: "color 0.15s, border-color 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {t.label}
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: active ? "var(--indigo-wash)" : "var(--surface-2)",
                  color: active ? "var(--indigo)" : "var(--ink-3)",
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="ks-input"
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={tab === "statement" ? "ค้นหาในประวัติบันทึกถ้อยคำ" : "ค้นหาในประวัติทัณฑ์บน"}
          />
        </div>
      </div>

      <div className="ks-card" style={{ overflow: "hidden" }}>
        {tab === "statement" ? (
          <StatementTable rows={statements} searching={!!searchValue} />
        ) : (
          <BondTable rows={bonds} searching={!!searchValue} />
        )}

        <div className="pagination">
          <span style={{ flex: 1 }}>
            แสดง <span className="mono">{start}–{end}</span> จาก <span className="mono">{total}</span> รายการ
          </span>
          <button className={`page-btn ${page === 1 ? "disabled" : ""}`} onClick={() => page > 1 && navigate(tab, page - 1, searchValue)}>
            <ChevronLeft size={12} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => navigate(tab, p, searchValue)}>{p}</button>
          ))}
          <button className={`page-btn ${page === totalPages ? "disabled" : ""}`} onClick={() => page < totalPages && navigate(tab, page + 1, searchValue)}>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

function StatementTable({ rows, searching }: { rows: StatementRow[]; searching: boolean }) {
  return (
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
        {rows.length === 0 ? (
          <tr>
            <td colSpan={6}>
              <div className="empty-state">
                {searching ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีรายการที่อนุมัติแล้ว"}
              </div>
            </td>
          </tr>
        ) : (
          rows.map((row) => (
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
              <td style={{ color: "var(--ink-2)" }}>{teacherName(row.approvedByTeacher)}</td>
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
  )
}

function BondTable({ rows, searching }: { rows: BondRow[]; searching: boolean }) {
  return (
    <table className="ks-table">
      <thead>
        <tr>
          <th style={{ width: 120 }}>วันที่</th>
          <th>นักเรียน</th>
          <th>ผู้ปกครอง</th>
          <th>มาตรการ</th>
          <th>อนุมัติโดย</th>
          <th style={{ width: 130 }}>สถานะ</th>
          <th className="col-actions">ดู</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={7}>
              <div className="empty-state">
                {searching ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีรายการที่อนุมัติแล้ว"}
              </div>
            </td>
          </tr>
        ) : (
          rows.map((row) => {
            const measures: string[] = []
            if (row.measureDeductScore) measures.push(`ตัดคะแนน${row.measureDeductPoints ? ` ${row.measureDeductPoints}` : ""}`)
            if (row.measureActivity) measures.push("กิจกรรม")
            if (row.measureSuspension) measures.push("พักเรียน")
            if (row.measureTransfer) measures.push("ย้าย")

            return (
              <tr key={row.id}>
                <td>
                  <div className="mono" style={{ fontSize: 13 }}>{formatThaiDate(row.contractDate)}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {row.semester && row.academicYear ? `${row.semester}/${row.academicYear}` : "—"}
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
                <td>
                  <div style={{ fontSize: 13.5 }}>{row.guardianName}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{row.guardianRelation}</div>
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
                <td style={{ color: "var(--ink-2)" }}>{teacherName(row.approvedByTeacher)}</td>
                <td><span className="chip chip-approved">อนุมัติแล้ว</span></td>
                <td className="col-actions">
                  <Link href={`/record/bond/${row.id}`} className="btn btn-ghost btn-sm btn-icon" title="ดูรายละเอียด">
                    <Eye size={14} />
                  </Link>
                </td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}
