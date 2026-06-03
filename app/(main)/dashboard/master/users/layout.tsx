import { auth } from "@/auth"
import { redirect } from "next/navigation"

// จัดการผู้ใช้ — เฉพาะ super admin (บัญชีที่ไม่ผูกกับครู) เท่านั้น
export default async function UsersMasterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard")
  return <>{children}</>
}
