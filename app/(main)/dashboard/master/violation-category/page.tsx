import { db } from "@/lib/db"
import { ShieldAlert } from "lucide-react"
import { MasterTable } from "@/components/master/master-table"

const PAGE_SIZE = 20

export default async function ViolationCategoryPage({
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
    db.violationCategory.count({ where }).catch(() => 0),
    db.violationCategory
      .findMany({ where, orderBy: { id: "asc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE })
      .catch(() => []),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
          <ShieldAlert className="w-4.5 h-4.5 text-[#F5A623]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2D1B00]">จัดการหมวดการผิดระเบียบ</h1>
          <p className="text-sm text-gray-400 mt-0.5">ตารางข้อมูลหลัก — หมวดหลัก · ทั้งหมด {total} รายการ</p>
        </div>
      </div>

      <MasterTable
        data={rows}
        columns={[{ key: "name", label: "ชื่อหมวด" }]}
        fields={[{ key: "name", label: "ชื่อหมวด", placeholder: "เช่น หมวดการเรียน" }]}
        total={total}
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        search={search}
        pageSize={PAGE_SIZE}
        apiBase="/api/master/violation-categories"
        searchPlaceholder="ค้นหาชื่อหมวด..."
        emptyText="ยังไม่มีข้อมูลหมวดการผิดระเบียบ"
      />
    </div>
  )
}
