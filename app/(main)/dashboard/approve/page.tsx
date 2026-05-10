import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ApprovalGrid } from "@/components/approval-grid"

async function getPendingStatements() {
  try {
    const rows = await db.statementRecord.findMany({
      where: { status: "pending" },
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
    })

    return rows.map((r) => ({
      id: r.id,
      recordDate: r.recordDate,
      recordedBy: r.recordedBy,
      semester: r.semester.value,
      academicYear: r.academicYear.year,
      violationCategory: r.violationCategory.name,
      status: r.status,
      student: r.student,
    }))
  } catch {
    return []
  }
}

export default async function ApprovePage() {
  const session = await auth()
  const role = session?.user?.role

  if (role !== "DIRECTOR" && role !== "VICE_DIRECTOR") redirect("/dashboard")

  const statements = await getPendingStatements()

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#2D1B00]">รายการบันทึกถ้อยคำที่รออนุมัติ</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          รอดำเนินการ {statements.length} รายการ
        </p>
      </div>

      <ApprovalGrid data={statements} />
    </div>
  )
}
