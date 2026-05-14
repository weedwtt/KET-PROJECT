"use client"

import { usePathname } from "next/navigation"
import { Search, Bell } from "lucide-react"

const CRUMBS: Record<string, string[]> = {
  "/dashboard":                          ["หน้าแรก", "Dashboard"],
  "/record/statement":                   ["บันทึกข้อมูล", "บันทึกถ้อยคำนักเรียน"],
  "/record/statement/new":               ["บันทึกข้อมูล", "บันทึกถ้อยคำนักเรียน", "สร้างใหม่"],
  "/dashboard/approve":                  ["อนุมัติ", "รายการรออนุมัติ"],
  "/dashboard/history":                  ["ประวัติและรายการบันทึก"],
  "/dashboard/reports":                  ["รายงาน", "รายงานและสถิติ"],
  "/dashboard/master/teachers":          ["จัดการระบบ", "จัดการครู"],
  "/dashboard/master/teachers/new":      ["จัดการระบบ", "จัดการครู", "เพิ่มครู"],
  "/dashboard/master/users":             ["จัดการระบบ", "จัดการผู้ใช้"],
  "/dashboard/master/users/new":         ["จัดการระบบ", "จัดการผู้ใช้", "เพิ่มผู้ใช้"],
  "/dashboard/master/semester":          ["จัดการระบบ", "Master Data", "ภาคเรียน"],
  "/dashboard/master/academic-year":     ["จัดการระบบ", "Master Data", "ปีการศึกษา"],
  "/dashboard/master/violation-category":    ["จัดการระบบ", "Master Data", "หมวดการผิดระเบียบ"],
  "/dashboard/master/violation-sub-category":["จัดการระบบ", "Master Data", "หมวดย่อย"],
}

function resolveCrumbs(pathname: string): string[] {
  if (CRUMBS[pathname]) return CRUMBS[pathname]
  if (pathname.includes("/approve/")) return ["อนุมัติ", "รายการรออนุมัติ", "รายละเอียด"]
  if (pathname.includes("/record/statement/") && pathname.includes("/edit")) return ["บันทึกข้อมูล", "บันทึกถ้อยคำนักเรียน", "แก้ไข"]
  if (pathname.includes("/record/statement/")) return ["บันทึกข้อมูล", "บันทึกถ้อยคำนักเรียน", "รายละเอียด"]
  if (pathname.includes("/master/teachers/")) return ["จัดการระบบ", "จัดการครู", "แก้ไข"]
  if (pathname.includes("/master/users/")) return ["จัดการระบบ", "จัดการผู้ใช้", "แก้ไข"]
  return ["—"]
}

export function Topbar() {
  const pathname = usePathname()
  const crumbs = resolveCrumbs(pathname)

  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? "current" : ""}>{c}</span>
          </span>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div className="topbar-search" style={{ position: "relative" }}>
        <Search
          size={14}
          style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "var(--ink-3)"
          }}
        />
        <input
          className="ks-input"
          style={{ height: 36, paddingLeft: 36, background: "var(--surface-2)", fontSize: 13 }}
          placeholder="ค้นหานักเรียน, รหัส, บันทึก..."
        />
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
          <span className="kbd">⌘K</span>
        </span>
      </div>

      <button className="icon-btn" title="แจ้งเตือน" style={{ position: "relative" }}>
        <Bell size={16} />
        <span style={{
          position: "absolute", top: 8, right: 9,
          width: 6, height: 6,
          background: "var(--amber)",
          borderRadius: "50%",
          border: "1.5px solid var(--surface)",
        }} />
      </button>
    </header>
  )
}
