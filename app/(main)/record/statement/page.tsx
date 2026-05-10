import Link from "next/link"
import { db } from "@/lib/db"
import { StatementGrid } from "@/components/statement-grid"

const PAGE_SIZE = 15

export default async function StatementListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page: pageParam, search: searchParam } = await searchParams
  const search = searchParam?.trim() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const where = {
    status: "pending",
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
        },
        orderBy: { recordDate: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      })
      .catch(() => []),
  ])

  const statements = rows.map((r) => ({
    id: r.id,
    recordDate: r.recordDate,
    recordedBy: r.recordedBy,
    semester: r.semester.value,
    academicYear: r.academicYear.year,
    violationCategory: r.violationCategory.name,
    status: r.status,
    student: r.student,
  }))

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2D1B00]">บันทึกถ้อยคำนักเรียน</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            รอดำเนินการ {total} รายการ
          </p>
        </div>
        <Link
          href="/record/statement/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#F5A623] hover:bg-[#e09518] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          เพิ่มบันทึกถ้อยคำนักเรียน
        </Link>
      </div>

      <StatementGrid
        data={statements}
        total={total}
        page={safePage}
        totalPages={totalPages}
        search={search}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
