"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import {
  BookOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart2,
  LogOut,
  Database,
  ShieldCheck,
  Users,
  UserCog,
  Menu,
  X,
} from "lucide-react"

interface SidebarProps {
  userName: string
  role?: string | null
}

export function Sidebar({ userName, role }: SidebarProps) {
  const isApprover = role === "DIRECTOR" || role === "VICE_DIRECTOR"
  const isAdmin = role === "ADMIN"
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [recordOpen, setRecordOpen] = useState(true)
  const [masterOpen, setMasterOpen] = useState(false)

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

  const w = collapsed ? "w-[90px]" : "w-[290px]"

  return (
    <aside
      className={`${w} flex flex-col min-h-screen bg-white border-r border-[#e8edf2] shrink-0 transition-all duration-300 ease-in-out`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 py-5 border-b border-[#e8edf2] ${collapsed ? "px-5 justify-center" : "px-6"}`}>
        <div className="w-9 h-9 rounded-xl bg-[#465fff] flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[#1c2434] font-bold text-sm leading-tight truncate">ระบบปกครอง</p>
            <p className="text-[#465fff] text-xs mt-0.5 truncate">รร.บางพลีราษฎร์บำรุง</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ${collapsed ? "ml-0" : ""}`}
          title={collapsed ? "ขยาย" : "ย่อ"}
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-5 space-y-0.5 overflow-y-auto ${collapsed ? "px-3" : "px-4"}`}>
        {!collapsed && (
          <p className="text-gray-400 text-xs font-semibold px-3 mb-3 tracking-wider uppercase">เมนูหลัก</p>
        )}

        {/* Dashboard */}
        <Link
          href="/dashboard"
          title={collapsed ? "Dashboard/รายงาน" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            collapsed ? "justify-center" : ""
          } ${
            pathname === "/dashboard"
              ? "bg-[#eff2ff] text-[#465fff]"
              : "text-[#64748b] hover:text-[#1c2434] hover:bg-gray-50"
          }`}
        >
          <BarChart2 className={`w-5 h-5 shrink-0 ${pathname === "/dashboard" ? "text-[#465fff]" : "text-gray-400"}`} />
          {!collapsed && <span>Dashboard/รายงาน</span>}
        </Link>

        {/* บันทึกข้อมูล */}
        {!isApprover && (
          <div>
            <button
              onClick={() => !collapsed && setRecordOpen((v) => !v)}
              title={collapsed ? "บันทึกข้อมูล" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#64748b] hover:text-[#1c2434] hover:bg-gray-50 transition-colors text-sm font-medium ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <FileText className="w-5 h-5 shrink-0 text-gray-400" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">บันทึกข้อมูล</span>
                  {recordOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-300" />
                  )}
                </>
              )}
            </button>

            {recordOpen && !collapsed && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#e8edf2] space-y-0.5">
                <Link
                  href="/record/statement"
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive("/record/statement")
                      ? "bg-[#eff2ff] text-[#465fff] font-semibold"
                      : "text-[#64748b] hover:text-[#1c2434] hover:bg-gray-50"
                  }`}
                >
                  บันทึกถ้อยคำนักเรียน
                </Link>
              </div>
            )}
          </div>
        )}

        {/* รออนุมัติ */}
        {isApprover && (
          <Link
            href="/dashboard/approve"
            title={collapsed ? "รออนุมัติ" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              collapsed ? "justify-center" : ""
            } ${
              isActive("/dashboard/approve")
                ? "bg-[#eff2ff] text-[#465fff]"
                : "text-[#64748b] hover:text-[#1c2434] hover:bg-gray-50"
            }`}
          >
            <ShieldCheck className={`w-5 h-5 shrink-0 ${isActive("/dashboard/approve") ? "text-[#465fff]" : "text-gray-400"}`} />
            {!collapsed && <span>รออนุมัติ</span>}
          </Link>
        )}

        {/* ประวัติและรายการบันทึก */}
        <Link
          href="/dashboard/history"
          title={collapsed ? "ประวัติและรายการบันทึก" : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            collapsed ? "justify-center" : ""
          } ${
            isActive("/dashboard/history")
              ? "bg-[#eff2ff] text-[#465fff]"
              : "text-[#64748b] hover:text-[#1c2434] hover:bg-gray-50"
          }`}
        >
          <Clock className={`w-5 h-5 shrink-0 ${isActive("/dashboard/history") ? "text-[#465fff]" : "text-gray-400"}`} />
          {!collapsed && <span>ประวัติและรายการบันทึก</span>}
        </Link>

        {/* จัดการระบบ — admin only */}
        {isAdmin && (
          <div className="mt-2 space-y-0.5">
            {!collapsed && (
              <p className="text-gray-400 text-xs font-semibold px-3 mt-4 mb-3 tracking-wider uppercase">จัดการระบบ</p>
            )}
            {collapsed && <div className="border-t border-[#e8edf2] my-3" />}
            <Link
              href="/dashboard/master/teachers"
              title={collapsed ? "จัดการครู" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive("/dashboard/master/teachers")
                  ? "bg-[#eff2ff] text-[#465fff]"
                  : "text-[#64748b] hover:text-[#1c2434] hover:bg-gray-50"
              }`}
            >
              <Users className={`w-5 h-5 shrink-0 ${isActive("/dashboard/master/teachers") ? "text-[#465fff]" : "text-gray-400"}`} />
              {!collapsed && <span>จัดการครู</span>}
            </Link>
            <Link
              href="/dashboard/master/users"
              title={collapsed ? "จัดการผู้ใช้" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive("/dashboard/master/users")
                  ? "bg-[#eff2ff] text-[#465fff]"
                  : "text-[#64748b] hover:text-[#1c2434] hover:bg-gray-50"
              }`}
            >
              <UserCog className={`w-5 h-5 shrink-0 ${isActive("/dashboard/master/users") ? "text-[#465fff]" : "text-gray-400"}`} />
              {!collapsed && <span>จัดการผู้ใช้</span>}
            </Link>
          </div>
        )}

        {/* ตารางข้อมูลหลัก */}
        {!isApprover && (
          <div className="mt-1">
            {!collapsed && <div className="border-t border-[#e8edf2] my-3" />}
            {collapsed && <div className="border-t border-[#e8edf2] my-3" />}
            <button
              onClick={() => !collapsed && setMasterOpen((v) => !v)}
              title={collapsed ? "ตารางข้อมูลหลัก" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#64748b] hover:text-[#1c2434] hover:bg-gray-50 transition-colors text-sm font-medium ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <Database className="w-5 h-5 shrink-0 text-gray-400" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">ตารางข้อมูลหลัก</span>
                  {masterOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-300" />
                  )}
                </>
              )}
            </button>

            {masterOpen && !collapsed && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#e8edf2] space-y-0.5">
                {[
                  { href: "/dashboard/master/semester", label: "ภาคเรียน" },
                  { href: "/dashboard/master/academic-year", label: "ปีการศึกษา" },
                  { href: "/dashboard/master/violation-category", label: "หมวดการผิดระเบียบ" },
                  { href: "/dashboard/master/violation-sub-category", label: "หมวดย่อยการผิดระเบียบ" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(href)
                        ? "bg-[#eff2ff] text-[#465fff] font-semibold"
                        : "text-[#64748b] hover:text-[#1c2434] hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={`border-t border-[#e8edf2] py-4 ${collapsed ? "px-3" : "px-4"}`}>
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="w-8 h-8 rounded-full bg-[#eff2ff] flex items-center justify-center shrink-0">
              <span className="text-[#465fff] text-xs font-bold">{userName.slice(0, 2).toUpperCase() || "U"}</span>
            </div>
            <p className="text-[#1c2434] text-sm font-medium truncate">{userName}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title={collapsed ? "ออกจากระบบ" : undefined}
          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[#64748b] hover:text-red-600 hover:bg-red-50 transition-colors text-sm cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  )
}
