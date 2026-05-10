import { db } from "@/lib/db"
import { Layers } from "lucide-react"
import { ViolationSubCategoryTable } from "@/components/master/violation-sub-category-table"

const PAGE_SIZE = 20

export default async function ViolationSubCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; categoryId?: string }>
}) {
  const { page: pageParam, search: searchParam, categoryId: catParam } = await searchParams
  const search = searchParam?.trim() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const categoryId = catParam ? Number(catParam) : undefined

  const where = {
    ...(categoryId ? { violationCategoryId: categoryId } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  }

  const [total, rows, categories] = await Promise.all([
    db.violationSubCategory.count({ where }).catch(() => 0),
    db.violationSubCategory
      .findMany({
        where,
        include: { violationCategory: { select: { id: true, name: true } } },
        orderBy: [{ violationCategoryId: "asc" }, { id: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      })
      .catch(() => []),
    db.violationCategory.findMany({ orderBy: { id: "asc" } }).catch(() => []),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
          <Layers className="w-4.5 h-4.5 text-[#F5A623]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2D1B00]">จัดการหมวดย่อยการผิดระเบียบ</h1>
          <p className="text-sm text-gray-400 mt-0.5">ตารางข้อมูลหลัก — หมวดย่อย · ทั้งหมด {total} รายการ</p>
        </div>
      </div>

      <ViolationSubCategoryTable
        data={rows}
        categories={categories}
        total={total}
        page={safePage}
        totalPages={totalPages}
        search={search}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
