"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, FileText, History, Inbox,
  Users, UserCog, ChevronDown,
  LogOut, PanelLeft, List, BarChart2, FileUp,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface SidebarProps {
  userName: string
  role?: string | null
}

const ROLE_LABEL: Record<string, string> = {
  TEACHER:        "ครู",
  DIRECTOR:       "ผู้อำนวยการ",
  VICE_DIRECTOR:  "รองผู้อำนวยการ",
  ADMIN:          "ผู้ดูแลระบบ",
}

export function Sidebar({ userName, role }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed]   = useState(false)
  const [recordOpen, setRecordOpen] = useState(true)
  const [masterOpen, setMasterOpen] = useState(false)

  const isApprover = role === "DIRECTOR" || role === "VICE_DIRECTOR"
  const isAdmin    = role === "ADMIN"
  const isActive   = (path: string) => pathname === path || pathname.startsWith(path + "/")

  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [isDelegateApprover, setIsDelegateApprover] = useState(false)
  const [isGradeHead, setIsGradeHead] = useState(false)

  // ตรวจสอบว่าเป็นผู้รับมอบอำนาจ หรือหัวหน้าระดับ (สำหรับ role ที่ไม่ใช่ approver/admin)
  useEffect(() => {
    if (isApprover || isAdmin) return
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setIsDelegateApprover((data?.delegateFor?.length ?? 0) > 0)
        setIsGradeHead(!!data?.gradeHeadLevel)
      })
      .catch(() => {})
  }, [isApprover, isAdmin])

  const canSeeApproval = isApprover || isAdmin || isDelegateApprover || isGradeHead

  useEffect(() => {
    if (!canSeeApproval) return
    fetch("/api/statements/pending-count")
      .then((r) => r.json())
      .then((data) => setPendingCount(data.count ?? 0))
      .catch(() => setPendingCount(null))
  }, [canSeeApproval, pathname])

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U"

  return (
    <aside className="ks-sidebar" data-collapsed={collapsed ? "true" : "false"}>

      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <Image src="/school-logo.png" alt="โลโก้โรงเรียน" width={36} height={36} style={{ objectFit: "contain", flexShrink: 0 }} />
        <div className="min-w-0 flex-1">
          <div className="brand-name">โรงเรียนบางพลีราษฎร์บำรุง</div>
          <div className="brand-sub">EST · 2475</div>
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="btn-ghost btn-icon btn-sm ml-auto"
          title={collapsed ? "ขยาย sidebar" : "ย่อ sidebar"}
          style={{ flexShrink: 0 }}
        >
          <PanelLeft size={15} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="sidebar-nav">

        <Link
          href="/dashboard"
          className={`nav-item ${pathname === "/dashboard" ? "active" : ""}`}
        >
          <LayoutDashboard size={16} className="nav-icon" />
          <span className="nav-label">Dashboard</span>
        </Link>

        {/* บันทึกข้อมูล — teacher / admin */}
        {!isApprover && (
          <div>
            <button
              className="nav-item w-full"
              onClick={() => !collapsed && setRecordOpen((v) => !v)}
            >
              <FileText size={16} className="nav-icon" />
              <span className="nav-label">บันทึกข้อมูล</span>
              <ChevronDown size={11} className={`nav-chevron ${recordOpen ? "open" : ""}`} />
            </button>
            {recordOpen && (
              <>
                <Link
                  href="/record/statement"
                  className={`nav-item child ${isActive("/record/statement") ? "active" : ""}`}
                >
                  <span className="nav-label">บันทึกถ้อยคำนักเรียน</span>
                </Link>
                <Link
                  href="/record/bond"
                  className={`nav-item child ${isActive("/record/bond") ? "active" : ""}`}
                >
                  <span className="nav-label">บันทึกทัณฑ์บน</span>
                </Link>
              </>
            )}
          </div>
        )}

        {/* รออนุมัติ — approver + admin + delegate */}
        {canSeeApproval && (
          <Link
            href="/dashboard/approve"
            className={`nav-item ${isActive("/dashboard/approve") ? "active" : ""}`}
          >
            <Inbox size={16} className="nav-icon" />
            <span className="nav-label">รออนุมัติ</span>
            {pendingCount !== null && pendingCount > 0 && (
              <span className="nav-badge">{pendingCount}</span>
            )}
          </Link>
        )}

        <Link
          href="/dashboard/history"
          className={`nav-item ${isActive("/dashboard/history") ? "active" : ""}`}
        >
          <History size={16} className="nav-icon" />
          <span className="nav-label">ประวัติและรายการบันทึก</span>
        </Link>

        <Link
          href="/dashboard/reports"
          className={`nav-item ${isActive("/dashboard/reports") ? "active" : ""}`}
        >
          <BarChart2 size={16} className="nav-icon" />
          <span className="nav-label">รายงานและสถิติ</span>
        </Link>

        {/* จัดการระบบ — admin */}
        {isAdmin && (
          <>
            <div className="nav-section-label">จัดการระบบ</div>
            <Link
              href="/dashboard/master/teachers"
              className={`nav-item ${isActive("/dashboard/master/teachers") ? "active" : ""}`}
            >
              <Users size={16} className="nav-icon" />
              <span className="nav-label">จัดการครู</span>
            </Link>
            <Link
              href="/dashboard/master/users"
              className={`nav-item ${isActive("/dashboard/master/users") ? "active" : ""}`}
            >
              <UserCog size={16} className="nav-icon" />
              <span className="nav-label">จัดการผู้ใช้</span>
            </Link>
            <Link
              href="/dashboard/master/import"
              className={`nav-item ${isActive("/dashboard/master/import") ? "active" : ""}`}
            >
              <FileUp size={16} className="nav-icon" />
              <span className="nav-label">นำเข้าข้อมูลนักเรียน</span>
            </Link>
          </>
        )}

        {/* Master Data — teacher / admin */}
        {!isApprover && (
          <div>
            <hr className="thin-rule" style={{ margin: "10px 2px" }} />
            <button
              className="nav-item w-full"
              onClick={() => !collapsed && setMasterOpen((v) => !v)}
            >
              <List size={16} className="nav-icon" />
              <span className="nav-label">ตารางข้อมูลหลัก</span>
              <ChevronDown size={11} className={`nav-chevron ${masterOpen ? "open" : ""}`} />
            </button>
            {masterOpen && (
              <>
                {[
                  { href: "/dashboard/master/semester",                label: "ภาคเรียน" },
                  { href: "/dashboard/master/academic-year",           label: "ปีการศึกษา" },
                  { href: "/dashboard/master/violation-category",      label: "หมวดการผิดระเบียบ" },
                  { href: "/dashboard/master/violation-sub-category",  label: "หมวดย่อยการผิดระเบียบ" },
                  { href: "/dashboard/master/recorders",               label: "ผู้บันทึก" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`nav-item child ${isActive(href) ? "active" : ""}`}
                  >
                    <span className="nav-label">{label}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar">{initials}</div>
        <div className="user-meta min-w-0 flex-1">
          <div className="user-name">{userName}</div>
          <div className="user-role">{ROLE_LABEL[role ?? ""] ?? role}</div>
        </div>
        <ThemeToggle />
        <button
          className="logout-btn"
          title="ออกจากระบบ"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
