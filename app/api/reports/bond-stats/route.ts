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
    total,
    distinctStudents,
    byStatusRaw,
    pending,
    approved,
    bySemesterRaw,
    allRecords,
    topStudentsRaw,
    measureDeductScore,
    measureActivity,
    measureSuspension,
    measureTransfer,
    sigGuardian,
    sigStudent,
    sigAdvisor,
    academicYears,
    semesters,
  ] = await Promise.all([
    db.bondRecord.count({ where }),
    db.bondRecord.groupBy({ by: ["studentId"], where }),
    db.bondRecord.groupBy({ by: ["status"], where, _count: { id: true } }),
    db.bondRecord.count({ where: { ...where, approvedAt: null } }),
    db.bondRecord.count({ where: { ...where, approvedAt: { not: null } } }),
    db.bondRecord.groupBy({
      by: ["semesterId"],
      where: { ...where, semesterId: { not: null } },
      _count: { id: true },
    }),
    db.bondRecord.findMany({
      where,
      select: { contractDate: true, studentId: true },
    }),
    db.bondRecord.groupBy({
      by: ["studentId"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    db.bondRecord.count({ where: { ...where, measureDeductScore: true } }),
    db.bondRecord.count({ where: { ...where, measureActivity: true } }),
    db.bondRecord.count({ where: { ...where, measureSuspension: true } }),
    db.bondRecord.count({ where: { ...where, measureTransfer: true } }),
    db.bondRecord.count({ where: { ...where, guardianSignature: { not: null } } }),
    db.bondRecord.count({ where: { ...where, studentSignature: { not: null } } }),
    db.bondRecord.count({ where: { ...where, advisorSignature: { not: null } } }),
    db.academicYear.findMany({ orderBy: { year: "desc" } }),
    db.semester.findMany({ orderBy: { value: "asc" } }),
  ])

  const semIds = bySemesterRaw
    .map((r) => r.semesterId)
    .filter((id): id is number => id != null)
  const semMap = await db.semester
    .findMany({ where: { id: { in: semIds } } })
    .then((rows) => new Map(rows.map((r) => [r.id, r])))

  const monthCounts: Record<string, number> = {}
  allRecords.forEach((r) => {
    const key = r.contractDate.toISOString().slice(0, 7)
    monthCounts[key] = (monthCounts[key] ?? 0) + 1
  })
  const monthlyTrend = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

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

  return NextResponse.json({
    total,
    studentCount: distinctStudents.length,
    byStatus: byStatusRaw.map((r) => ({ status: r.status, count: r._count.id })),
    pending,
    approved,
    bySemester: bySemesterRaw
      .filter((r) => r.semesterId != null)
      .map((r) => ({
        semesterId: r.semesterId!,
        semesterName: semMap.get(r.semesterId!)?.name ?? "",
        count: r._count.id,
      })),
    monthlyTrend,
    byGradeLevel,
    topStudents: topStudentsRaw.map((r) => ({
      ...studentsMap.get(r.studentId),
      count: r._count.id,
    })),
    measures: {
      deductScore: measureDeductScore,
      activity: measureActivity,
      suspension: measureSuspension,
      transfer: measureTransfer,
    },
    signatureStats: {
      guardian: sigGuardian,
      student: sigStudent,
      advisor: sigAdvisor,
      total,
    },
    academicYears,
    semesters,
  })
}
