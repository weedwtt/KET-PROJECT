import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const yearIdParam = searchParams.get("yearId")
  const semesterIdParam = searchParams.get("semesterId")

  const yearId = yearIdParam ? parseInt(yearIdParam) : undefined
  const semesterId = semesterIdParam ? parseInt(semesterIdParam) : undefined

  const where = {
    ...(yearId ? { academicYearId: yearId } : {}),
    ...(semesterId ? { semesterId } : {}),
  }

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
    db.statementRecord.findMany({
      where,
      select: { recordDate: true, violationCategoryId: true, studentId: true },
    }),
    db.academicYear.findMany({ orderBy: { year: "desc" } }),
    db.semester.findMany({ orderBy: { value: "asc" } }),
  ])

  // Enrich semester data
  const semIds = bySemesterRaw.map((r) => r.semesterId)
  const semMap = await db.semester
    .findMany({ where: { id: { in: semIds } } })
    .then((rows) => new Map(rows.map((r) => [r.id, r])))

  // Enrich category data
  const catIds = byCategoryRaw.map((r) => r.violationCategoryId)
  const catMap = await db.violationCategory
    .findMany({ where: { id: { in: catIds } } })
    .then((rows) => new Map(rows.map((r) => [r.id, r])))

  // Enrich sub-category data
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

  // Enrich top students
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

  // Monthly trend
  const monthCounts: Record<string, number> = {}
  allRecords.forEach((r) => {
    const key = r.recordDate.toISOString().slice(0, 7)
    monthCounts[key] = (monthCounts[key] ?? 0) + 1
  })
  const monthlyTrend = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

  // Grade level breakdown
  const allStudentIds = [...new Set(allRecords.map((r) => r.studentId))]
  const studentGradeMap = await db.student
    .findMany({ where: { id: { in: allStudentIds } }, select: { id: true, gradeLevel: true } })
    .then((rows) => new Map(rows.map((r) => [r.id, r.gradeLevel])))

  const gradeCountMap: Record<string, number> = {}
  allRecords.forEach((r) => {
    const g = studentGradeMap.get(r.studentId) ?? "ไม่ระบุ"
    gradeCountMap[g] = (gradeCountMap[g] ?? 0) + 1
  })
  const byGradeLevel = Object.entries(gradeCountMap)
    .map(([gradeLevel, count]) => ({ gradeLevel, count }))
    .sort((a, b) => {
      const na = parseInt(a.gradeLevel.replace(/\D/g, "")) || 999
      const nb = parseInt(b.gradeLevel.replace(/\D/g, "")) || 999
      return na - nb
    })

  // Category momentum: first-half months vs second-half months
  const allMonths = [...new Set(allRecords.map((r) => r.recordDate.toISOString().slice(0, 7)))].sort()
  const mid = Math.ceil(allMonths.length / 2)
  const firstHalf = new Set(allMonths.slice(0, mid))

  const catHalves: Record<number, { first: number; second: number }> = {}
  if (allMonths.length >= 3) {
    allRecords.forEach((r) => {
      const catId = r.violationCategoryId
      if (catId == null) return
      if (!catHalves[catId]) catHalves[catId] = { first: 0, second: 0 }
      const month = r.recordDate.toISOString().slice(0, 7)
      if (firstHalf.has(month)) catHalves[catId].first++
      else catHalves[catId].second++
    })
  }
  const categoryMomentum = Object.entries(catHalves)
    .map(([catIdStr, counts]) => {
      const catId = parseInt(catIdStr)
      return {
        categoryId: catId,
        categoryName: catMap.get(catId)?.name ?? "",
        first: counts.first,
        second: counts.second,
        delta: counts.second - counts.first,
      }
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  return NextResponse.json({
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
    byGradeLevel,
    categoryMomentum,
    topStudents: topStudentsRaw.map((r) => ({
      ...studentsMap.get(r.studentId),
      count: r._count.id,
    })),
    academicYears,
    semesters,
  })
}
