import { db } from "@/lib/db"
import Link from "next/link"
import { UserCog, Plus } from "lucide-react"
import { UserTable } from "@/components/master/user-table"

const PAGE_SIZE = 20

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page: pageParam, search: searchParam } = await searchParams
  const search = searchParam?.trim() ?? ""
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const where = search
    ? {
        OR: [
          { username: { contains: search, mode: "insensitive" as const } },
          { teacher: { firstName: { contains: search, mode: "insensitive" as const } } },
          { teacher: { lastName: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {}

  const [total, users] = await Promise.all([
    db.user.count({ where }).catch(() => 0),
    db.user
      .findMany({
        where,
        include: {
          teacher: {
            include: { title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      })
      .catch(() => []),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const rows = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    teacher: u.teacher
      ? {
          ...u.teacher,
          role: u.teacher.role as string | null,
          gradeHeadLevel: u.teacher.gradeHeadLevel as string | null,
        }
      : null,
  }))

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#eff2ff] flex items-center justify-center">
            <UserCog className="w-4.5 h-4.5 text-[#465fff]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1c2434]">จัดการผู้ใช้</h1>
            <p className="text-sm text-gray-400 mt-0.5">ตารางข้อมูลหลัก — ผู้ใช้งาน · ทั้งหมด {total} รายการ</p>
          </div>
        </div>
        <Link
          href="/dashboard/master/users/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#465fff] text-white text-sm font-semibold hover:bg-[#3a4fd4] transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มผู้ใช้
        </Link>
      </div>

      {/* Search */}
      <form method="get" className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="ค้นหาชื่อผู้ใช้หรือชื่อครู..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff]"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[#465fff] text-white text-sm font-semibold hover:bg-[#3a4fd4] transition-colors"
        >
          ค้นหา
        </button>
        {search && (
          <Link
            href="/dashboard/master/users"
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ล้าง
          </Link>
        )}
      </form>

      {/* Table */}
      <UserTable users={rows} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
              ) : (
                <Link
                  key={p}
                  href={`?page=${p}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                    p === safePage
                      ? "bg-[#465fff] text-white font-bold"
                      : "text-gray-600 hover:bg-[#f8f9ff]"
                  }`}
                >
                  {p}
                </Link>
              )
            )}
        </div>
      )}
    </div>
  )
}
