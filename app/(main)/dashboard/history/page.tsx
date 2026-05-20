import { db } from "@/lib/db"
import { HistoryTabs } from "@/components/history-tabs"

const PAGE_SIZE = 15

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; search?: string }>
}) {
  const { tab: tabParam, page: pageParam, search: searchParam } = await searchParams
  const tab = tabParam === "bond" ? "bond" : "statement"
  const search = searchParam?.trim() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  // Unfiltered totals for the tab badges
  const [statementCount, bondCount] = await Promise.all([
    db.statementRecord.count({ where: { status: "approved" } }).catch(() => 0),
    db.bondRecord.count({ where: { directorSignature: { not: null } } }).catch(() => 0),
  ])

  let statements: StatementRow[] = []
  let bonds: BondRow[] = []
  let total = 0

  if (tab === "statement") {
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

    const [count, rows] = await Promise.all([
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
          skip,
          take: PAGE_SIZE,
        })
        .catch(() => []),
    ])

    total = count
    statements = rows.map((r) => ({
      id: r.id,
      recordDate: r.recordDate.toISOString(),
      semester: r.semester.value,
      academicYear: r.academicYear.year,
      violationCategory: r.violationCategory.name,
      student: r.student,
      approvedByTeacher: r.approvedByTeacher,
    }))
  } else {
    const where = {
      directorSignature: { not: null },
      ...(search
        ? {
            OR: [
              { student: { studentCode: { contains: search, mode: "insensitive" as const } } },
              { student: { firstName: { contains: search, mode: "insensitive" as const } } },
              { student: { lastName: { contains: search, mode: "insensitive" as const } } },
              { guardianName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [count, rows] = await Promise.all([
      db.bondRecord.count({ where }).catch(() => 0),
      db.bondRecord
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
            approvedByTeacher: {
              select: {
                firstName: true,
                lastName: true,
                title: { select: { name: true } },
              },
            },
          },
          orderBy: { approvedAt: "desc" },
          skip,
          take: PAGE_SIZE,
        })
        .catch(() => []),
    ])

    total = count
    bonds = rows.map((r) => ({
      id: r.id,
      contractDate: r.contractDate.toISOString(),
      semester: r.semester?.value ?? null,
      academicYear: r.academicYear?.year ?? null,
      guardianName: r.guardianName,
      guardianRelation: r.guardianRelation,
      measureDeductScore: r.measureDeductScore,
      measureDeductPoints: r.measureDeductPoints,
      measureActivity: r.measureActivity,
      measureSuspension: r.measureSuspension,
      measureTransfer: r.measureTransfer,
      student: r.student,
      approvedByTeacher: r.approvedByTeacher,
    }))
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  return (
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>คลังประวัติ · บันทึกที่อนุมัติแล้ว</span>
          </div>
          <h1>ประวัติและรายการบันทึก</h1>
        </div>
      </div>

      <HistoryTabs
        tab={tab}
        statements={statements}
        bonds={bonds}
        statementCount={statementCount}
        bondCount={bondCount}
        total={total}
        page={safePage}
        totalPages={totalPages}
        search={search}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}

type StatementRow = {
  id: number
  recordDate: string
  semester: number
  academicYear: number
  violationCategory: string
  student: {
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    title: { name: string }
  }
  approvedByTeacher: {
    firstName: string
    lastName: string
    title: { name: string }
  } | null
}

type BondRow = {
  id: number
  contractDate: string
  semester: number | null
  academicYear: number | null
  guardianName: string
  guardianRelation: string
  measureDeductScore: boolean
  measureDeductPoints: number | null
  measureActivity: boolean
  measureSuspension: boolean
  measureTransfer: boolean
  student: {
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    title: { name: string }
  }
  approvedByTeacher: {
    firstName: string
    lastName: string
    title: { name: string }
  } | null
}
