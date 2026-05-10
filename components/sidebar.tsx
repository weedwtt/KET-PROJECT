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
} from "lucide-react"

interface SidebarProps {
  userName: string
  role?: string | null
}

export function Sidebar({ userName, role }: SidebarProps) {
  const isApprover = role === "ผอ" || role === "รองผอ"
  const pathname = usePathname()
  const [recordOpen, setRecordOpen] = useState(true)
  const [masterOpen, setMasterOpen] = useState(false)

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

  return (
    <aside className="flex flex-col w-[270px] min-h-screen bg-[#241800] shrink-0">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 py-7 px-5 border-b border-white/10">
        <div className="w-12 h-12 rounded-xl bg-[#F5A623] flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-[#1a1a1a]" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-base leading-tight">ระบบปกครอง</p>
          <p className="text-[#F5A623] text-xs mt-0.5">รร.บางพลีราษฎร์บำรุง</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-white/40 text-xs font-medium px-2 mb-3 tracking-wider uppercase">
          เมนูหลัก
        </p>

        {/* Dashboard/รายงาน — อยู่บนสุด */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard"
              ? "bg-[#F5A623] text-[#1a1a1a]"
              : "text-white/80 hover:text-white hover:bg-white/8"
          }`}
        >
          <BarChart2 className="w-4 h-4 shrink-0 text-white/60" />
          <span>Dashboard/รายงาน</span>
        </Link>

        {/* บันทึกข้อมูล (collapsible) — ซ่อนสำหรับ ผอ/รองผอ */}
        {!isApprover && <div>
          <button
            onClick={() => setRecordOpen((prev) => !prev)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/8 transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4 shrink-0 text-white/60" />
            <span className="flex-1 text-left">บันทึกข้อมูล</span>
            {recordOpen ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </button>

          {recordOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
              <Link
                href="/record/statement"
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive("/record/statement")
                    ? "bg-[#F5A623] text-[#1a1a1a] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/8"
                }`}
              >
                บันทึกถ้อยคำนักเรียน
              </Link>

            </div>
          )}
        </div>}

        {/* รออนุมัติ — เฉพาะ ผอ/รองผอ */}
        {isApprover && (
          <Link
            href="/dashboard/approve"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/dashboard/approve")
                ? "bg-[#F5A623] text-[#1a1a1a]"
                : "text-white/80 hover:text-white hover:bg-white/8"
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-white/60" />
            <span>รออนุมัติ</span>
          </Link>
        )}

        {/* ประวัติและรายการบันทึก */}
        <Link
          href="/dashboard/history"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive("/dashboard/history")
              ? "bg-[#F5A623] text-[#1a1a1a]"
              : "text-white/80 hover:text-white hover:bg-white/8"
          }`}
        >
          <Clock className="w-4 h-4 shrink-0 text-white/60" />
          <span>ประวัติและรายการบันทึก</span>
        </Link>

        {/* ตารางข้อมูลหลัก — ซ่อนสำหรับ ผอ/รองผอ */}
        {!isApprover && <div>
          <button
            onClick={() => setMasterOpen((prev) => !prev)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/8 transition-colors text-sm font-medium"
          >
            <Database className="w-4 h-4 shrink-0 text-white/60" />
            <span className="flex-1 text-left">ตารางข้อมูลหลัก</span>
            {masterOpen ? (
              <ChevronUp className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40" />
            )}
          </button>

          {masterOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-0.5">
              <Link
                href="/dashboard/master/semester"
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive("/dashboard/master/semester")
                    ? "bg-[#F5A623] text-[#1a1a1a] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/8"
                }`}
              >
                ภาคเรียน
              </Link>
              <Link
                href="/dashboard/master/academic-year"
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive("/dashboard/master/academic-year")
                    ? "bg-[#F5A623] text-[#1a1a1a] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/8"
                }`}
              >
                ปีการศึกษา
              </Link>
              <Link
                href="/dashboard/master/violation-category"
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive("/dashboard/master/violation-category")
                    ? "bg-[#F5A623] text-[#1a1a1a] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/8"
                }`}
              >
                หมวดการผิดระเบียบ
              </Link>
              <Link
                href="/dashboard/master/violation-sub-category"
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive("/dashboard/master/violation-sub-category")
                    ? "bg-[#F5A623] text-[#1a1a1a] font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/8"
                }`}
              >
                หมวดย่อยการผิดระเบียบ
              </Link>
            </div>
          )}
        </div>}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-white/40 text-xs mb-3">เข้าสู่ระบบโดย: {userName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/8 transition-colors text-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  )
}
