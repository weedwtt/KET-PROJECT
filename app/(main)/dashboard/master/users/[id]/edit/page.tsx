import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, UserCog } from "lucide-react"
import { UserForm } from "@/components/master/user-form"

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await db.user.findUnique({
    where: { id: Number(id) },
    include: { teacher: { include: { title: true } } },
  })

  if (!user) notFound()

  const teacher = user.teacher

  const initialData = {
    userId: user.id,
    teacherId: teacher?.id,
    username: user.username,
    password: "",
    confirmPassword: "",
    titleId: teacher ? String(teacher.titleId) : "",
    firstName: teacher?.firstName ?? "",
    lastName: teacher?.lastName ?? "",
    phone: teacher?.phone ?? "",
    role: (teacher?.role as string) ?? "",
    gradeHeadLevel: (teacher?.gradeHeadLevel as string) ?? "",
    signatureUrl: teacher?.signatureUrl ?? "",
    addressHouseNo: teacher?.addressHouseNo ?? "",
    addressMoo: teacher?.addressMoo ?? "",
    addressVillage: teacher?.addressVillage ?? "",
    addressRoad: teacher?.addressRoad ?? "",
    addressSoi: teacher?.addressSoi ?? "",
    addressSubDistrict: teacher?.addressSubDistrict ?? "",
    addressDistrict: teacher?.addressDistrict ?? "",
    addressProvince: teacher?.addressProvince ?? "",
    addressPostalCode: teacher?.addressPostalCode ?? "",
  }

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
          <h1 className="text-xl font-bold text-[#2D1B00]">แก้ไขผู้ใช้งาน</h1>
          <p className="text-sm text-gray-400 mt-0.5">{user.username}</p>
        </div>
      </div>

      <UserForm mode="edit" initialData={initialData} />
    </div>
  )
}
