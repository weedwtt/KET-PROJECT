import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { UserForm } from "@/components/master/user-form"

export default function NewUserPage() {
  return (
    <div className="ks-page" style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/master/users" className="btn btn-ghost btn-sm btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="page-eyebrow"><span className="num">§M6</span><span>ข้อมูลหลัก · เพิ่มผู้ใช้</span></div>
            <h1>เพิ่มผู้ใช้งาน</h1>
          </div>
        </div>
      </div>
      <UserForm mode="create" />
    </div>
  )
}
