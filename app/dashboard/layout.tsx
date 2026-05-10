import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/")

  const signOutAction = async () => {
    "use server"
    await signOut({ redirectTo: "/" })
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={session.user?.name ?? ""} signOutAction={signOutAction} />
      <main className="flex-1 overflow-auto bg-[#FAF6EE]">
        {children}
      </main>
    </div>
  )
}
