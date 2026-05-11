"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  DIRECTOR: "ผอ.",
  VICE_DIRECTOR: "รองผอ.",
  TEACHER: "ครู",
  ADMIN: "admin",
}

const GRADE_LABEL: Record<string, string> = {
  M1: "ม.1", M2: "ม.2", M3: "ม.3", M4: "ม.4", M5: "ม.5", M6: "ม.6",
}

type UserRow = {
  id: number
  username: string
  createdAt: string
  teacher: {
    id: number
    firstName: string
    lastName: string
    role: string | null
    gradeHeadLevel: string | null
    title: { name: string }
  } | null
}

type Props = {
  users: UserRow[]
}

export function UserTable({ users: initial }: Props) {
  const router = useRouter()
  const [users, setUsers] = useState(initial)
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(id: number) {
    if (!confirm("ยืนยันการลบผู้ใช้นี้? (จะลบข้อมูลครูที่ผูกกันไว้ด้วย)")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/master/users/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? "ไม่สามารถลบได้")
        return
      }
      setUsers((prev) => prev.filter((u) => u.id !== id))
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
        ยังไม่มีข้อมูลผู้ใช้
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อผู้ใช้</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อ-นามสกุล</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">บทบาท</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">หัวหน้าระดับ</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-[#eff2ff]/30 transition-colors">
              <td className="px-4 py-3 font-mono font-medium text-[#1c2434]">{u.username}</td>
              <td className="px-4 py-3 text-gray-700">
                {u.teacher
                  ? `${u.teacher.title.name}${u.teacher.firstName} ${u.teacher.lastName}`
                  : <span className="text-gray-400 italic">super admin</span>}
              </td>
              <td className="px-4 py-3">
                {u.teacher?.role ? (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#eff2ff] text-[#3a4fd4]">
                    {ROLE_LABEL[u.teacher.role] ?? u.teacher.role}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {u.teacher?.gradeHeadLevel ? (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    หัวหน้า {GRADE_LABEL[u.teacher.gradeHeadLevel] ?? u.teacher.gradeHeadLevel}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Link
                    href={`/dashboard/master/users/${u.id}/edit`}
                    className="p-1.5 rounded-lg hover:bg-[#eff2ff] text-[#465fff] transition-colors"
                    title="แก้ไข"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deleting === u.id}
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
