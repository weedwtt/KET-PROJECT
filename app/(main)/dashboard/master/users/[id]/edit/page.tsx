import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
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
    <div className="ks-page" style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/master/users" className="btn btn-ghost btn-sm btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="page-eyebrow"><span>ข้อมูลหลัก · แก้ไขผู้ใช้</span></div>
            <h1>แก้ไขผู้ใช้ — {user.username}</h1>
          </div>
        </div>
      </div>
      <UserForm mode="edit" initialData={initialData} />
    </div>
  )
}
