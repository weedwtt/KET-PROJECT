export const dynamic = 'force-dynamic'

import { db } from "@/lib/db"
import { Calendar } from "lucide-react"
import { MasterTable } from "@/components/master/master-table"

const PAGE_SIZE = 20

export default async function AcademicYearPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page: pageParam, search: searchParam } = await searchParams
  const search = searchParam?.trim() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const where = search
    ? { year: { equals: isNaN(Number(search)) ? undefined : Number(search) } }
    : {}

  const [total, rows] = await Promise.all([
    db.academicYear.count({ where }).catch(() => 0),
    db.academicYear
      .findMany({ where, orderBy: { year: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE })
      .catch(() => []),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span>ข้อมูลหลัก · ปีการศึกษา</span></div>
          <h1>จัดการปีการศึกษา</h1>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-3)" }}>ทั้งหมด <span className="mono">{total}</span> รายการ</div>
      </div>

      <MasterTable
        data={rows}
        columns={[{ key: "year", label: "ปีการศึกษา (พ.ศ.)" }]}
        fields={[{ key: "year", label: "ปีการศึกษา (พ.ศ.)", type: "number", placeholder: "เช่น 2569", width: "w-48" }]}
        total={total}
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        search={search}
        pageSize={PAGE_SIZE}
        apiBase="/api/master/academic-years"
        searchPlaceholder="ค้นหาปีการศึกษา..."
        emptyText="ยังไม่มีข้อมูลปีการศึกษา"
      />
    </div>
  )
}
