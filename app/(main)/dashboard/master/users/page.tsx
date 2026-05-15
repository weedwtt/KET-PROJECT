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
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span>ข้อมูลหลัก · ผู้ใช้งาน</span></div>
          <h1>จัดการผู้ใช้</h1>
        </div>
        <Link href="/dashboard/master/users/new" className="btn btn-primary">
          <Plus size={14} /> เพิ่มผู้ใช้
        </Link>
      </div>

      <div className="toolbar">
        <form method="get" style={{ display: "flex", gap: 8, flex: 1 }}>
          <div className="search-wrap" style={{ maxWidth: 400 }}>
            <input
              name="search"
              className="ks-input"
              defaultValue={search}
              placeholder="ค้นหาชื่อผู้ใช้หรือชื่อครู..."
            />
          </div>
          <button type="submit" className="btn btn-secondary">ค้นหา</button>
          {search && (
            <Link href="/dashboard/master/users" className="btn btn-ghost">ล้าง</Link>
          )}
        </form>
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>ทั้งหมด <span className="mono">{total}</span> รายการ</span>
      </div>

      <UserTable users={rows} />

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 16 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "var(--ink-4)" }}>…</span>
              ) : (
                <Link
                  key={p}
                  href={`?page=${p}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  className={`page-btn ${p === safePage ? "active" : ""}`}
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
