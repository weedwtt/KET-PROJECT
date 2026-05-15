import Link from "next/link"
import { db } from "@/lib/db"
import { StatementGrid } from "@/components/statement-grid"
import { Plus, Filter, Download } from "lucide-react"

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
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            
            <span>บันทึกข้อมูล · บันทึกถ้อยคำนักเรียน</span>
          </div>
          <h1>บันทึกถ้อยคำนักเรียน</h1>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary">
            <Filter size={14} />ตัวกรอง
          </button>
          <Link href="/record/statement/new" className="btn btn-primary">
            <Plus size={14} />บันทึกถ้อยคำใหม่
          </Link>
        </div>
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
