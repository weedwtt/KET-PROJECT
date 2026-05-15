"use client"

import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

const CRUMBS: Record<string, string[]> = {
  "/dashboard":                               ["หน้าแรก", "Dashboard"],
  "/record/statement":                        ["บันทึกข้อมูล", "บันทึกถ้อยคำนักเรียน"],
  "/record/statement/new":                    ["บันทึกข้อมูล", "บันทึกถ้อยคำนักเรียน", "สร้างใหม่"],
  "/dashboard/approve":                       ["อนุมัติ", "รายการรออนุมัติ"],
  "/dashboard/history":                       ["ประวัติ", "ประวัติและรายการบันทึก"],
  "/dashboard/reports":                       ["รายงาน", "รายงานและสถิติ"],
  "/dashboard/master/teachers":               ["จัดการระบบ", "จัดการครู"],
  "/dashboard/master/teachers/new":           ["จัดการระบบ", "จัดการครู", "เพิ่มครู"],
  "/dashboard/master/users":                  ["จัดการระบบ", "จัดการผู้ใช้"],
  "/dashboard/master/users/new":              ["จัดการระบบ", "จัดการผู้ใช้", "เพิ่มผู้ใช้"],
  "/dashboard/master/semester":               ["Master Data", "ภาคเรียน"],
  "/dashboard/master/academic-year":          ["Master Data", "ปีการศึกษา"],
  "/dashboard/master/violation-category":     ["Master Data", "หมวดการผิดระเบียบ"],
  "/dashboard/master/violation-sub-category": ["Master Data", "หมวดย่อย"],
}

function resolveCrumbs(pathname: string): string[] {
  if (CRUMBS[pathname]) return CRUMBS[pathname]
  if (pathname.includes("/approve/"))                                    return ["อนุมัติ", "รายการรออนุมัติ", "รายละเอียด"]
  if (pathname.includes("/record/statement/") && pathname.includes("/edit")) return ["บันทึกข้อมูล", "บันทึกถ้อยคำนักเรียน", "แก้ไข"]
  if (pathname.includes("/record/statement/"))                           return ["บันทึกข้อมูล", "บันทึกถ้อยคำนักเรียน", "รายละเอียด"]
  if (pathname.includes("/master/teachers/"))                            return ["จัดการระบบ", "จัดการครู", "แก้ไข"]
  if (pathname.includes("/master/users/"))                               return ["จัดการระบบ", "จัดการผู้ใช้", "แก้ไข"]
  return ["—"]
}

export function Topbar() {
  const pathname = usePathname()
  const crumbs   = resolveCrumbs(pathname)

  return (
    <header className="topbar">
      {/* Breadcrumbs */}
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? "current" : ""}>{c}</span>
          </span>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  )
}
