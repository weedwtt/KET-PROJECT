import { db } from "@/lib/db"
import { UserPen } from "lucide-react"
import { MasterTable } from "@/components/master/master-table"

const PAGE_SIZE = 20

export default async function RecordersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page: pageParam, search: searchParam } = await searchParams
  const search = searchParam?.trim() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const where = search ? { name: { contains: search } } : {}

  const [total, rows] = await Promise.all([
    db.recorder.count({ where }).catch(() => 0),
    db.recorder
      .findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE })
      .catch(() => []),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span>ข้อมูลหลัก · ผู้บันทึก</span></div>
          <h1>จัดการผู้บันทึก</h1>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-3)" }}>ทั้งหมด <span className="mono">{total}</span> รายการ</div>
      </div>

      <MasterTable
        data={rows}
        columns={[{ key: "name", label: "ชื่อผู้บันทึก" }]}
        fields={[{ key: "name", label: "ชื่อผู้บันทึก", type: "text", placeholder: "เช่น นายสมชาย ใจดี" }]}
        total={total}
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        search={search}
        pageSize={PAGE_SIZE}
        apiBase="/api/master/recorders"
        searchPlaceholder="ค้นหาผู้บันทึก..."
        emptyText="ยังไม่มีข้อมูลผู้บันทึก"
      />
    </div>
  )
}
