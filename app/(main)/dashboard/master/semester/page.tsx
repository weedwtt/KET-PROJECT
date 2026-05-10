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
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
          <BookOpen className="w-4.5 h-4.5 text-[#F5A623]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2D1B00]">จัดการภาคเรียน</h1>
          <p className="text-sm text-gray-400 mt-0.5">ตารางข้อมูลหลัก — ภาคเรียน · ทั้งหมด {total} รายการ</p>
        </div>
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
