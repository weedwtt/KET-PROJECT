import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Users } from "lucide-react"
import { TeacherForm } from "@/components/master/teacher-form"

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const teacher = await db.teacher.findUnique({
    where: { id: Number(id) },
    include: { title: true },
  })

  if (!teacher) notFound()

  const initialData = {
    id: teacher.id,
    titleId: String(teacher.titleId),
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    phone: teacher.phone,
    role: teacher.role ?? "",
    gradeHeadLevel: teacher.gradeHeadLevel ?? "",
    signatureUrl: teacher.signatureUrl ?? "",
    addressHouseNo: teacher.addressHouseNo,
    addressMoo: teacher.addressMoo ?? "",
    addressVillage: teacher.addressVillage ?? "",
    addressRoad: teacher.addressRoad ?? "",
    addressSoi: teacher.addressSoi ?? "",
    addressSubDistrict: teacher.addressSubDistrict,
    addressDistrict: teacher.addressDistrict,
    addressProvince: teacher.addressProvince,
    addressPostalCode: teacher.addressPostalCode,
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Back */}
      <Link
        href="/dashboard/master/teachers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2D1B00] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        กลับไปรายการครู
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
          <Users className="w-4.5 h-4.5 text-[#F5A623]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2D1B00]">แก้ไขข้อมูลครู</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {teacher.title.name}{teacher.firstName} {teacher.lastName}
          </p>
        </div>
      </div>

      <TeacherForm mode="edit" initialData={initialData} />
    </div>
  )
}
