"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, Trash2, UserCheck, PenLine } from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  DIRECTOR: "ผอ.",
  VICE_DIRECTOR: "รองผอ.",
  TEACHER: "ครู",
  ADMIN: "admin",
}

const GRADE_LABEL: Record<string, string> = {
  M1: "ม.1", M2: "ม.2", M3: "ม.3", M4: "ม.4", M5: "ม.5", M6: "ม.6",
}

type TeacherRow = {
  id: number
  firstName: string
  lastName: string
  phone: string
  role: string | null
  gradeHeadLevel: string | null
  signatureUrl: string | null
  title: { name: string }
  user: { id: number; username: string } | null
}

type Props = {
  teachers: TeacherRow[]
}

export function TeacherTable({ teachers: initial }: Props) {
  const router = useRouter()
  const [teachers, setTeachers] = useState(initial)
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(id: number) {
    if (!confirm("ยืนยันการลบครูนี้?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/master/teachers/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? "ไม่สามารถลบได้")
        return
      }
      setTeachers((prev) => prev.filter((t) => t.id !== id))
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  if (teachers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
        ยังไม่มีข้อมูลครู
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อ-นามสกุล</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">บทบาท</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">หัวหน้าระดับ</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">เบอร์โทร</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600">ลายเซ็น</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600">บัญชีผู้ใช้</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {teachers.map((t) => (
            <tr key={t.id} className="hover:bg-amber-50/30 transition-colors">
              <td className="px-4 py-3 font-medium text-[#2D1B00]">
                {t.title.name}{t.firstName} {t.lastName}
              </td>
              <td className="px-4 py-3">
                {t.role ? (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {ROLE_LABEL[t.role] ?? t.role}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {t.gradeHeadLevel ? (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    หัวหน้า {GRADE_LABEL[t.gradeHeadLevel] ?? t.gradeHeadLevel}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">{t.phone}</td>
              <td className="px-4 py-3 text-center">
                {t.signatureUrl ? (
                  <PenLine className="w-4 h-4 text-green-600 mx-auto" />
                ) : (
                  <span className="text-gray-300 text-xs">ไม่มี</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {t.user ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700">
                    <UserCheck className="w-3.5 h-3.5" />
                    {t.user.username}
                  </span>
                ) : (
                  <span className="text-gray-300 text-xs">ไม่มี</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Link
                    href={`/dashboard/master/teachers/${t.id}/edit`}
                    className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
                    title="แก้ไข"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
