"use client"

import { useRouter } from "next/navigation"

type Row = {
  id: number
  recordDate: Date
  status: string
  student: {
    studentCode: string
    firstName: string
    lastName: string
    title?: { name: string } | null
  }
  violationCategory: { name: string }
}

export function RecentRecordsTable({ rows }: { rows: Row[] }) {
  const router = useRouter()

  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="empty-state">ยังไม่มีข้อมูล</td>
      </tr>
    )
  }

  return (
    <>
      {rows.map((r) => (
        <tr
          key={r.id}
          className="clickable"
          onClick={() => router.push(`/record/statement/${r.id}`)}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push(`/record/statement/${r.id}`)}
          aria-label={`ดูบันทึกของ ${r.student.title?.name ?? ""}${r.student.firstName} ${r.student.lastName}`}
        >
          <td className="col-mono">
            {new Date(r.recordDate).toLocaleDateString("th-TH", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </td>
          <td className="col-mono">{r.student.studentCode}</td>
          <td>
            <div style={{ fontWeight: 500 }}>
              {r.student.title?.name}{r.student.firstName} {r.student.lastName}
            </div>
          </td>
          <td>{r.violationCategory.name}</td>
          <td>
            <span className={`chip chip-${r.status === "approved" ? "approved" : "pending"}`}>
              {r.status === "approved" ? "อนุมัติแล้ว" : "รออนุมัติ"}
            </span>
          </td>
        </tr>
      ))}
    </>
  )
}
