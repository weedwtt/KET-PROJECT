import Link from "next/link"
import { ChevronLeft, Users } from "lucide-react"
import { TeacherForm } from "@/components/master/teacher-form"

export default function NewTeacherPage() {
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Back */}
      <Link
        href="/dashboard/master/teachers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1c2434] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        กลับไปรายการครู
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#eff2ff] flex items-center justify-center">
          <Users className="w-4.5 h-4.5 text-[#465fff]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1c2434]">เพิ่มครู</h1>
          <p className="text-sm text-gray-400 mt-0.5">กรอกข้อมูลครูใหม่</p>
        </div>
      </div>

      <TeacherForm mode="create" />
    </div>
  )
}
