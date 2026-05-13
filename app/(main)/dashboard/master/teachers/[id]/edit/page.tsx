import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
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
    <div className="ks-page" style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/master/teachers" className="btn btn-ghost btn-sm btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="page-eyebrow"><span className="num">§M5</span><span>ข้อมูลหลัก · แก้ไขครู</span></div>
            <h1>แก้ไขข้อมูลครู — {teacher.title.name}{teacher.firstName} {teacher.lastName}</h1>
          </div>
        </div>
      </div>
      <TeacherForm mode="edit" initialData={initialData} />
    </div>
  )
}
