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

  const statCards = [
    { label: "นักเรียนในระบบ", value: studentCount, icon: Users, color: "text-[#465fff]", bg: "bg-[#eff2ff]" },
    { label: "บันทึกถ้อยคำ", value: statementCount, icon: FileText, color: "text-[#465fff]", bg: "bg-[#eff2ff]" },
    { label: "บันทึกทัณฑ์บน", value: bondCount, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "ดำเนินการสำเร็จ", value: approvedCount, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
  ]

  return (
    <div className="min-h-screen bg-[#f2f5fa] p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1c2434]">Dashboard / รายงาน</h1>
        <p className="text-sm text-gray-500 mt-0.5">ภาพรวมระบบบันทึกพฤติกรรมนักเรียน</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#e8edf2] shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{label}</p>
              <p className="text-3xl font-bold text-[#1c2434]">{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Records */}
      <div className="bg-white rounded-2xl border border-[#e8edf2] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1c2434]">รายการบันทึกล่าสุด</h2>
          <span className="text-xs text-gray-400">10 รายการล่าสุด</span>
        </div>

        {recentRecords.length === 0 ? (
          <p className="text-center text-gray-400 py-10">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#e8edf2]">
                  <th className="pb-3 pr-4 font-semibold text-gray-500">วันที่</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-500">นักเรียน</th>
                  <th className="pb-3 pr-4 font-semibold text-gray-500">หมวดหมู่</th>
                  <th className="pb-3 font-semibold text-gray-500">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f5fa]">
                {recentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-3 pr-4 text-gray-500">
                      {new Date(record.recordDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-4 text-[#1c2434] font-medium">
                      {record.student.title.name}{record.student.firstName} {record.student.lastName}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{record.violationCategory.name}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          record.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-[#eff2ff] text-[#465fff]"
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
