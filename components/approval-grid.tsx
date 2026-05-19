"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react"

type Bond = {
  id: number
  contractDate: string
  guardianName: string
  recorder: string
  student: {
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    title: { name: string }
  }
}

type Statement = {
  id: number
  recordDate: Date
  semester: number
  academicYear: number
  violationCategory: string
  recordedBy: string | null
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

export function ApprovalGrid({ data, bonds = [] }: { data: Statement[]; bonds?: Bond[] }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<"statement" | "bond">("statement")
  const [bondSearch, setBondSearch] = useState("")

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

  const filteredBonds = useMemo(() => {
    if (!bondSearch.trim()) return bonds
    const q = bondSearch.toLowerCase()
    return bonds.filter((b) =>
      b.student.studentCode.includes(q) ||
      b.student.firstName.toLowerCase().includes(q) ||
      b.student.lastName.toLowerCase().includes(q) ||
      b.guardianName.toLowerCase().includes(q)
    )
  }, [bonds, bondSearch])

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
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "2px solid var(--rule)" }}>
        <button
          onClick={() => setTab("statement")}
          style={{
            padding: "10px 20px", fontSize: 13.5, fontWeight: 500,
            background: "none", border: "none", cursor: "pointer",
            borderBottom: tab === "statement" ? "2px solid var(--indigo)" : "2px solid transparent",
            color: tab === "statement" ? "var(--indigo)" : "var(--ink-3)",
            marginBottom: -2,
          }}
        >
          บันทึกถ้อยคำนักเรียน
          {data.length > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: "var(--indigo)", color: "#fff", borderRadius: 10, padding: "1px 6px" }}>{data.length}</span>}
        </button>
        <button
          onClick={() => setTab("bond")}
          style={{
            padding: "10px 20px", fontSize: 13.5, fontWeight: 500,
            background: "none", border: "none", cursor: "pointer",
            borderBottom: tab === "bond" ? "2px solid var(--indigo)" : "2px solid transparent",
            color: tab === "bond" ? "var(--indigo)" : "var(--ink-3)",
            marginBottom: -2,
          }}
        >
          บันทึกทัณฑ์บน
          {bonds.length > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: "var(--indigo)", color: "#fff", borderRadius: 10, padding: "1px 6px" }}>{bonds.length}</span>}
        </button>
      </div>

      {tab === "statement" && (
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
      )}

      {tab === "bond" && (
        <div>
          <div className="toolbar">
            <div className="search-wrap">
              <Search size={15} className="search-icon" />
              <input
                className="ks-input"
                type="text"
                value={bondSearch}
                onChange={(e) => setBondSearch(e.target.value)}
                placeholder="ค้นหาด้วยรหัสนักเรียน · ชื่อ-สกุล · ชื่อผู้ปกครอง"
              />
            </div>
          </div>
          <div className="ks-card" style={{ overflow: "hidden" }}>
            <table className="ks-table">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>วันที่/รหัส</th>
                  <th>นักเรียน</th>
                  <th>ผู้ปกครอง</th>
                  <th>ผู้บันทึก</th>
                  <th className="col-actions">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredBonds.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state">{bondSearch ? "ไม่พบรายการที่ค้นหา" : "ไม่มีรายการทัณฑ์บนที่รอลงนาม"}</div></td></tr>
                ) : (
                  filteredBonds.map((b) => (
                    <tr key={b.id} className="clickable" onClick={() => window.location.href = `/dashboard/approve/bond/${b.id}`}>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{new Date(b.contractDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>BK-{String(b.id).padStart(4, "0")}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{b.student.title.name}{b.student.firstName} {b.student.lastName}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>{b.student.studentCode} · {b.student.gradeLevel}/{b.student.classRoom}</div>
                      </td>
                      <td>{b.guardianName}</td>
                      <td style={{ color: "var(--ink-2)" }}>{b.recorder}</td>
                      <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/dashboard/approve/bond/${b.id}`} className="btn btn-primary btn-sm">
                          ลงนาม <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="pagination">
              <span style={{ flex: 1 }}>
                แสดง <span className="mono">{bonds.length === 0 ? 0 : 1}–{filteredBonds.length}</span> จาก <span className="mono">{filteredBonds.length}</span> รายการ
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
