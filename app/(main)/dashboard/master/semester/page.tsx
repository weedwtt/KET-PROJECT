export const dynamic = 'force-dynamic'

import { db } from "@/lib/db"
import { BookOpen } from "lucide-react"
import { MasterTable } from "@/components/master/master-table"

const PAGE_SIZE = 20

export default async function SemesterPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page: pageParam, search: searchParam } = await searchParams
  const search = searchParam?.trim() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {}

  const [total, rows] = await Promise.all([
    db.semester.count({ where }).catch(() => 0),
    db.semester
      .findMany({ where, orderBy: { value: "asc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE })
      .catch(() => []),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span>ข้อมูลหลัก · ภาคเรียน</span></div>
          <h1>จัดการภาคเรียน</h1>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-3)" }}>ทั้งหมด <span className="mono">{total}</span> รายการ</div>
      </div>

      <MasterTable
        data={rows}
        columns={[
          { key: "name", label: "ชื่อภาคเรียน" },
          { key: "value", label: "ค่า" },
        ]}
        fields={[
          { key: "name", label: "ชื่อภาคเรียน", placeholder: "เช่น ภาคเรียนที่ 1" },
          { key: "value", label: "ค่า", type: "number", placeholder: "1", width: "w-24" },
        ]}
        total={total}
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        search={search}
        pageSize={PAGE_SIZE}
        apiBase="/api/master/semesters"
        searchPlaceholder="ค้นหาภาคเรียน..."
        emptyText="ยังไม่มีข้อมูลภาคเรียน"
      />
    </div>
  )
}
