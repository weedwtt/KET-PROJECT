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
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span className="num">§05</span>
            <span>คลังประวัติ · บันทึกที่อนุมัติแล้ว</span>
          </div>
          <h1>ประวัติและรายการบันทึก</h1>
        </div>
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
