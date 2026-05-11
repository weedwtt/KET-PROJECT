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
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ""}`)
  }

  function onSearchChange(val: string) {
    setSearchValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate(1, val)
    }, 400)
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Search bar */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
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
              <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ผู้อนุมัติ</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ภาคเรียน</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-center">ดู</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16 text-gray-400">
                  {initialSearch || searchValue ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีรายการที่อนุมัติแล้ว"}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 tabular-nums">{start + idx}</td>
                  <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap tabular-nums">
                    {formatThaiDate(row.recordDate)}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-gray-700">{row.student.studentCode}</td>
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
                    {row.approvedByTeacher
                      ? `${row.approvedByTeacher.title.name}${row.approvedByTeacher.firstName} ${row.approvedByTeacher.lastName}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap tabular-nums">
                    {row.semester}/{row.academicYear}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Link
                      href={`/record/statement/${row.id}`}
                      className="inline-flex p-1.5 rounded-md text-gray-400 hover:text-[#465fff] hover:bg-[#eff2ff] transition-colors"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="w-4 h-4" />
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
          แสดง {start}–{end} จาก {total} รายการ
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(page - 1, searchValue)}
            disabled={page === 1}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…")
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => navigate(p as number, searchValue)}
                  className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    page === p
                      ? "bg-[#465fff] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => navigate(page + 1, searchValue)}
            disabled={page === totalPages}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
