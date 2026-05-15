import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { TeacherForm } from "@/components/master/teacher-form"

export default function NewTeacherPage() {
  return (
    <div className="ks-page" style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/master/teachers" className="btn btn-ghost btn-sm btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="page-eyebrow"><span>ข้อมูลหลัก · เพิ่มครู</span></div>
            <h1>เพิ่มครู</h1>
          </div>
        </div>
      </div>
      <TeacherForm mode="create" />
    </div>
  )
}
