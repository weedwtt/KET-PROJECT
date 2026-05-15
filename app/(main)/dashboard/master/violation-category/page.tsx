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
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span>ข้อมูลหลัก · หมวดการผิดระเบียบ</span></div>
          <h1>จัดการหมวดการผิดระเบียบ</h1>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-3)" }}>ทั้งหมด <span className="mono">{total}</span> รายการ</div>
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
