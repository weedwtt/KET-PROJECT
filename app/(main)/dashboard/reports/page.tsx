import { db } from "@/lib/db"
import { ReportCharts, type StatsData } from "@/components/report-charts"
import { BarChart2 } from "lucide-react"

async function getInitialStats(): Promise<StatsData> {
  const latestYear = await db.academicYear.findFirst({ orderBy: { year: "desc" } })
  const where = latestYear ? { academicYearId: latestYear.id } : {}

  const [
    totalRecords,
    pending,
    approved,
    distinctStudents,
    bySemesterRaw,
    byCategoryRaw,
    bySubCategoryRaw,
    topStudentsRaw,
    allRecords,
    academicYears,
    semesters,
  ] = await Promise.all([
    db.statementRecord.count({ where }),
    db.statementRecord.count({ where: { ...where, status: "pending" } }),
    db.statementRecord.count({ where: { ...where, status: "approved" } }),
    db.statementRecord.groupBy({ by: ["studentId"], where }),
    db.statementRecord.groupBy({ by: ["semesterId"], where, _count: { id: true } }),
    db.statementRecord.groupBy({ by: ["violationCategoryId"], where, _count: { id: true } }),
    db.statementRecord.groupBy({
      by: ["violationSubCategoryId", "violationCategoryId"],
      where: { ...where, violationSubCategoryId: { not: null } },
      _count: { id: true },
    }),
    db.statementRecord.groupBy({
      by: ["studentId"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    db.statementRecord.findMany({ where, select: { recordDate: true } }),
    db.academicYear.findMany({ orderBy: { year: "desc" } }),
    db.semester.findMany({ orderBy: { value: "asc" } }),
  ])

  const semIds = bySemesterRaw.map((r) => r.semesterId)
  const semMap = await db.semester
    .findMany({ where: { id: { in: semIds } } })
    .then((rows) => new Map(rows.map((r) => [r.id, r])))

  const catIds = byCategoryRaw.map((r) => r.violationCategoryId)
  const catMap = await db.violationCategory
    .findMany({ where: { id: { in: catIds } } })
    .then((rows) => new Map(rows.map((r) => [r.id, r])))

  const subIds = bySubCategoryRaw.map((r) => r.violationSubCategoryId!).filter(Boolean)
  const subCatIds = [...new Set(bySubCategoryRaw.map((r) => r.violationCategoryId))]
  const [subMap, subCatMap] = await Promise.all([
    db.violationSubCategory
      .findMany({ where: { id: { in: subIds } } })
      .then((rows) => new Map(rows.map((r) => [r.id, r]))),
    db.violationCategory
      .findMany({ where: { id: { in: subCatIds } } })
      .then((rows) => new Map(rows.map((r) => [r.id, r]))),
  ])

  const topIds = topStudentsRaw.map((r) => r.studentId)
  const studentsMap = await db.student
    .findMany({
      where: { id: { in: topIds } },
      select: {
        id: true,
        studentCode: true,
        firstName: true,
        lastName: true,
        gradeLevel: true,
        classRoom: true,
      },
    })
    .then((rows) => new Map(rows.map((r) => [r.id, r])))

  const monthCounts: Record<string, number> = {}
  allRecords.forEach((r) => {
    const key = r.recordDate.toISOString().slice(0, 7)
    monthCounts[key] = (monthCounts[key] || 0) + 1
  })
  const monthlyTrend = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

  return {
    totalRecords,
    studentCount: distinctStudents.length,
    pending,
    approved,
    bySemester: bySemesterRaw.map((r) => ({
      semesterId: r.semesterId,
      semesterName: semMap.get(r.semesterId)?.name ?? "",
      count: r._count.id,
    })),
    byCategory: byCategoryRaw
      .map((r) => ({
        categoryId: r.violationCategoryId,
        categoryName: catMap.get(r.violationCategoryId)?.name ?? "",
        count: r._count.id,
      }))
      .sort((a, b) => b.count - a.count),
    bySubCategory: bySubCategoryRaw
      .map((r) => ({
        subId: r.violationSubCategoryId!,
        subName: subMap.get(r.violationSubCategoryId!)?.name ?? "",
        categoryId: r.violationCategoryId,
        categoryName: subCatMap.get(r.violationCategoryId)?.name ?? "",
        count: r._count.id,
      }))
      .sort((a, b) => b.count - a.count),
    monthlyTrend,
    topStudents: topStudentsRaw.map((r) => ({
      ...studentsMap.get(r.studentId),
      count: r._count.id,
    })) as StatsData["topStudents"],
    academicYears,
    semesters,
  }
}

export default async function ReportsPage() {
  const data = await getInitialStats()

  return (
    <div className="ks-page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span className="num">§06</span>
            <span>รายงาน · วิเคราะห์และสถิติ</span>
          </div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart2 size={22} style={{ color: "var(--indigo)", flexShrink: 0 }} />
            รายงานพฤติกรรมนักเรียน
          </h1>
        </div>
      </div>

      <ReportCharts initialData={data} />
    </div>
  )
}
