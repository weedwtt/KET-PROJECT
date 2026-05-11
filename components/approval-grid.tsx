"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, ShieldCheck, Clock } from "lucide-react"

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

interface ApprovalGridProps {
  data: Statement[]
}

const PAGE_SIZE = 15

export function ApprovalGrid({ data }: ApprovalGridProps) {
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
        r.violationCategory.toLowerCase().includes(q) ||
        `${r.student.gradeLevel}/${r.student.classRoom}`.includes(q)
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handleSearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Search bar */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, รหัส, ชั้น, หมวดความผิด..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-semibold text-gray-600 w-12">ลำดับ</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">วันที่บันทึก</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">รหัสนักเรียน</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อ-นามสกุล</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ชั้น/ห้อง</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">หมวดความผิด</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ผู้บันทึก</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ภาคเรียน</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">สถานะ</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-center whitespace-nowrap">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16 text-gray-400">
                  {search ? "ไม่พบรายการที่ค้นหา" : "ไม่มีรายการที่รออนุมัติ"}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={row.id} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 tabular-nums">
                    {(safePage - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap tabular-nums">
                    {formatDate(row.recordDate)}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-gray-700">
                    {row.student.studentCode}
                  </td>
                  <td className="px-4 py-3.5 text-gray-900 font-medium">
                    {row.student.title.name}{row.student.firstName} {row.student.lastName}
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">
                    {row.student.gradeLevel}/{row.student.classRoom}
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 max-w-[200px] truncate" title={row.violationCategory}>
                    {row.violationCategory}
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">
                    {row.recordedBy}
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap tabular-nums">
                    {row.semester}/{row.academicYear}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#eff2ff] text-[#465fff] text-xs font-semibold rounded-full whitespace-nowrap">
                      <Clock className="w-3 h-3" /> รอดำเนินการ
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Link
                      href={`/dashboard/approve/${row.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                      title="ดูรายละเอียดและอนุมัติ"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      ดูและอนุมัติ
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          แสดง {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
          {Math.min(safePage * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…")
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    safePage === p ? "bg-[#465fff] text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
