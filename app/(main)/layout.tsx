import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/")

  return (
    <div className="app-shell">
      <Sidebar userName={session.user?.name ?? ""} role={session.user?.role ?? null} />
      <div className="app-main">
        <Topbar />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
