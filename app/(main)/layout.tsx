import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/")

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user?.name ?? ""} role={session.user?.role ?? null} />
      <main className="flex-1 overflow-auto bg-[#FAF6EE]">
        {children}
      </main>
    </div>
  )
}
