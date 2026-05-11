import { db } from "@/lib/db"
import { CheckCircle2 } from "lucide-react"
import { HistoryGrid } from "@/components/history-grid"

const PAGE_SIZE = 15

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page: pageParam, search: searchParam } = await searchParams
  const search = searchParam?.trim() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const where = {
    status: "approved",
    ...(search
      ? {
          OR: [
            { student: { studentCode: { contains: search, mode: "insensitive" as const } } },
            { student: { firstName: { contains: search, mode: "insensitive" as const } } },
            { student: { lastName: { contains: search, mode: "insensitive" as const } } },
            { violationCategory: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  }

  const [total, rows] = await Promise.all([
    db.statementRecord.count({ where }).catch(() => 0),
    db.statementRecord
      .findMany({
        where,
        include: {
          student: {
            select: {
              studentCode: true,
              firstName: true,
              lastName: true,
              gradeLevel: true,
              classRoom: true,
              title: { select: { name: true } },
            },
          },
          semester: { select: { value: true } },
          academicYear: { select: { year: true } },
          violationCategory: { select: { name: true } },
          approvedByTeacher: {
            select: {
              firstName: true,
              lastName: true,
              title: { select: { name: true } },
            },
          },
        },
        orderBy: { approvedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      })
      .catch(() => []),
  ])

  const records = rows.map((r) => ({
    id: r.id,
    recordDate: r.recordDate.toISOString(),
    semester: r.semester.value,
    academicYear: r.academicYear.year,
    violationCategory: r.violationCategory.name,
    student: r.student,
    approvedByTeacher: r.approvedByTeacher,
  }))

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1c2434]">ประวัติและรายการบันทึก</h1>
          <p className="text-sm text-gray-500 mt-0.5">รายการที่อนุมัติแล้ว · ทั้งหมด {total} รายการ</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้วทั้งหมด
        </span>
      </div>

      <HistoryGrid
        data={records}
        total={total}
        page={safePage}
        totalPages={totalPages}
        search={search}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
