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
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
          <Calendar className="w-4.5 h-4.5 text-[#F5A623]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2D1B00]">จัดการปีการศึกษา</h1>
          <p className="text-sm text-gray-400 mt-0.5">ตารางข้อมูลหลัก — ปีการศึกษา · ทั้งหมด {total} รายการ</p>
        </div>
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
