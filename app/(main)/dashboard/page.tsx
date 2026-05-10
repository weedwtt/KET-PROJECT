import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Users, FileText, AlertTriangle, CheckCircle } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/")

  const [studentCount, statementCount, bondCount, approvedCount, recentRecords] = await Promise.all([
    db.student.count(),
    db.statementRecord.count(),
    db.statementBond.count(),
    db.statementRecord.count({ where: { status: "approved" } }),
    db.statementRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        student: { include: { title: true } },
        violationCategory: true,
      },
    }),
  ])

  return (
    <div className="min-h-screen bg-[#FDF8EE] p-6">
      <h1 className="text-2xl font-bold text-[#2D1B00] mb-6">Dashboard / รายงาน</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">นักเรียนในระบบ</p>
            <p className="text-3xl font-bold text-[#2D1B00]">{studentCount}</p>
          </div>
          <Users className="w-10 h-10 text-[#F5A623]" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">บันทึกถ้อยคำ</p>
            <p className="text-3xl font-bold text-[#2D1B00]">{statementCount}</p>
          </div>
          <FileText className="w-10 h-10 text-[#F5A623]" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">บันทึกทัณฑ์บน</p>
            <p className="text-3xl font-bold text-[#2D1B00]">{bondCount}</p>
          </div>
          <AlertTriangle className="w-10 h-10 text-[#F59E0B]" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">ดำเนินการ<br />สำเร็จ</p>
            <p className="text-3xl font-bold text-[#2D1B00]">{approvedCount}</p>
          </div>
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
      </div>

      {/* Recent Records */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-[#F5A623] mb-4">รายการบันทึกล่าสุด</h2>

        {recentRecords.length === 0 ? (
          <p className="text-center text-gray-400 py-8">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 pr-4 font-medium">วันที่</th>
                  <th className="pb-3 pr-4 font-medium">นักเรียน</th>
                  <th className="pb-3 pr-4 font-medium">หมวดหมู่</th>
                  <th className="pb-3 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="py-3 pr-4 text-gray-600">
                      {new Date(record.recordDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-4 text-[#2D1B00]">
                      {record.student.title.name}{record.student.firstName} {record.student.lastName}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{record.violationCategory.name}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          record.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {record.status === "approved" ? "อนุมัติแล้ว" : "รอดำเนินการ"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
