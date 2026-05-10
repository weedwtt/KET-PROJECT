import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/")

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8EE] px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-10 text-center space-y-4 w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#F5A623] flex items-center justify-center mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#2D1B00]">ระบบปกครอง</h1>
        <p className="text-gray-500 text-sm">
          ยินดีต้อนรับ,{" "}
          <span className="font-semibold text-[#F5A623]">{session.user?.name}</span>
        </p>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}
        >
          <button
            type="submit"
            className="mt-2 px-6 py-2.5 rounded-xl bg-[#F5A623] hover:bg-[#e09518] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </form>
      </div>
    </div>
  )
}
