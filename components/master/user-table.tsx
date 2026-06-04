"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  DIRECTOR: "ผอ.",
  VICE_DIRECTOR: "รองผอ.",
  TEACHER: "ครู",
  DISCIPLINE: "ฝ่ายปกครอง",
  ADMIN: "admin",
  SUPER_ADMIN: "super admin",
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

export function UserTable({ users }: Props) {
  const router = useRouter()
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
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  if (users.length === 0) {
    return (
      <div className="ks-card">
        <div className="empty-state">ยังไม่มีข้อมูลผู้ใช้</div>
      </div>
    )
  }

  return (
    <div className="ks-card" style={{ overflow: "hidden" }}>
      <table className="ks-table">
        <thead>
          <tr>
            <th>ชื่อผู้ใช้</th>
            <th>ชื่อ-นามสกุล</th>
            <th>บทบาท</th>
            <th>หัวหน้าระดับ</th>
            <th className="col-actions">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="mono" style={{ fontWeight: 500 }}>{u.username}</td>
              <td>
                {u.teacher
                  ? `${u.teacher.title.name}${u.teacher.firstName} ${u.teacher.lastName}`
                  : <span style={{ color: "var(--ink-4)", fontStyle: "italic" }}>super admin</span>}
              </td>
              <td>
                {u.teacher?.role ? (
                  <span className="chip chip-approved">{ROLE_LABEL[u.teacher.role] ?? u.teacher.role}</span>
                ) : (
                  <span style={{ color: "var(--ink-4)" }}>—</span>
                )}
              </td>
              <td>
                {u.teacher?.gradeHeadLevel ? (
                  <span className="chip chip-pending">หัวหน้า {GRADE_LABEL[u.teacher.gradeHeadLevel] ?? u.teacher.gradeHeadLevel}</span>
                ) : (
                  <span style={{ color: "var(--ink-4)" }}>—</span>
                )}
              </td>
              <td className="col-actions">
                <div style={{ display: "flex", gap: 4 }}>
                  <Link href={`/dashboard/master/users/${u.id}/edit`} className="btn btn-ghost btn-sm btn-icon" title="แก้ไข">
                    <Pencil size={13} />
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => handleDelete(u.id)}
                    disabled={deleting === u.id}
                    title="ลบ"
                    style={{ color: "var(--rose)" }}
                  >
                    <Trash2 size={13} />
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
