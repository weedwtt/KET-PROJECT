import Link from "next/link"
import { ChevronLeft, UserCog } from "lucide-react"
import { UserForm } from "@/components/master/user-form"

export default function NewUserPage() {
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Back */}
      <Link
        href="/dashboard/master/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2D1B00] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        กลับไปรายการผู้ใช้
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
          <UserCog className="w-4.5 h-4.5 text-[#F5A623]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2D1B00]">เพิ่มผู้ใช้งาน</h1>
          <p className="text-sm text-gray-400 mt-0.5">สร้างบัญชีผู้ใช้และข้อมูลครูพร้อมกัน</p>
        </div>
      </div>

      <UserForm mode="create" />
    </div>
  )
}
