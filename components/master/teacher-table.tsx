"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, Trash2, UserCheck, PenLine } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

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
      <div className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] shadow-sm overflow-hidden">
        <div className="empty-state">ยังไม่มีข้อมูลครู</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>ชื่อ-นามสกุล</TableHead>
            <TableHead>บทบาท</TableHead>
            <TableHead>หัวหน้าระดับ</TableHead>
            <TableHead>เบอร์โทร</TableHead>
            <TableHead className="text-center" style={{ width: 80 }}>ลายเซ็น</TableHead>
            <TableHead className="text-center" style={{ width: 120 }}>บัญชีผู้ใช้</TableHead>
            <TableHead className="text-right w-px whitespace-nowrap">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((t) => (
            <TableRow key={t.id}>
              <TableCell style={{ fontWeight: 500 }}>
                {t.title.name}{t.firstName} {t.lastName}
              </TableCell>
              <TableCell>
                {t.role ? (
                  <span className="chip chip-approved">{ROLE_LABEL[t.role] ?? t.role}</span>
                ) : (
                  <span style={{ color: "var(--ink-4)" }}>—</span>
                )}
              </TableCell>
              <TableCell>
                {t.gradeHeadLevel ? (
                  <span className="chip chip-pending">หัวหน้า {GRADE_LABEL[t.gradeHeadLevel] ?? t.gradeHeadLevel}</span>
                ) : (
                  <span style={{ color: "var(--ink-4)" }}>—</span>
                )}
              </TableCell>
              <TableCell className="mono" style={{ fontSize: 13, color: "var(--ink-2)" }}>{t.phone}</TableCell>
              <TableCell className="text-center">
                {t.signatureUrl ? (
                  <PenLine size={14} style={{ color: "var(--sage)", margin: "0 auto" }} />
                ) : (
                  <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ไม่มี</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {t.user ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--sage)" }}>
                    <UserCheck size={13} /> {t.user.username}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ไม่มี</span>
                )}
              </TableCell>
              <TableCell className="text-right w-px whitespace-nowrap">
                <div style={{ display: "flex", gap: 4 }}>
                  <Link
                    href={`/dashboard/master/teachers/${t.id}/edit`}
                    className="btn btn-ghost btn-sm btn-icon"
                    title="แก้ไข"
                  >
                    <Pencil size={13} />
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                    title="ลบ"
                    style={{ color: "var(--rose)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
