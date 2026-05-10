import Link from "next/link"
import { db } from "@/lib/db"
import { CheckCircle2, Eye } from "lucide-react"

const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]

function formatThaiDate(d: Date) {
  const dt = new Date(d)
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543}`
}

async function getApprovedStatements() {
  try {
    return await db.statementRecord.findMany({
      where: { status: "approved" },
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
    })
  } catch {
    return []
  }
}

export default async function HistoryPage() {
  const records = await getApprovedStatements()

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2D1B00]">ประวัติและรายการบันทึก</h1>
          <p className="text-sm text-gray-500 mt-0.5">รายการที่อนุมัติแล้ว · ทั้งหมด {records.length} รายการ</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้วทั้งหมด
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 w-12">ลำดับ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">วันที่บันทึก</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">รหัสนักเรียน</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อ-นามสกุล</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ชั้น/ห้อง</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">หมวดความผิด</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ผู้อนุมัติ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ภาคเรียน</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">ดู</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    ยังไม่มีรายการที่อนุมัติแล้ว
                  </td>
                </tr>
              ) : (
                records.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-green-50/40 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap tabular-nums">
                      {formatThaiDate(row.recordDate)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-gray-700">{row.student.studentCode}</td>
                    <td className="px-4 py-3.5 text-gray-900 font-medium">
                      {row.student.title.name}{row.student.firstName} {row.student.lastName}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">
                      {row.student.gradeLevel}/{row.student.classRoom}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 max-w-[200px] truncate" title={row.violationCategory.name}>
                      {row.violationCategory.name}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">
                      {row.approvedByTeacher
                        ? `${row.approvedByTeacher.title.name}${row.approvedByTeacher.firstName} ${row.approvedByTeacher.lastName}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap tabular-nums">
                      {row.semester.value}/{row.academicYear.year}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Link
                        href={`/record/statement/${row.id}`}
                        className="inline-flex p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
