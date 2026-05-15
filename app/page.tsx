import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  return (
    <div className="login-screen">

      {/* ── Left art panel ── */}
      <div className="login-art">
        <div className="login-art-grid" />
        <div className="login-art-dots" />

        {/* Brand */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 46, height: 46,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 19,
          }}>บพ</div>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
              EST · 2475
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>โรงเรียนบางพลีราษฎร์บำรุง</div>
          </div>
        </div>

        {/* Hero */}
        <div style={{ position: "relative", marginTop: "auto", marginBottom: 72 }}>
          <div style={{
            display: "inline-block",
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
            marginBottom: 20,
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "3px 10px", borderRadius: 99,
          }}>
            § ระบบบันทึกความประพฤตินักเรียน
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 500, lineHeight: 1.24, letterSpacing: "-0.018em", margin: "0 0 20px", maxWidth: 500 }}>
            บันทึกอย่างเป็นระเบียบ<br />
            อนุมัติอย่างเป็นธรรม<br />
            <span style={{ color: "#93c5fd" }}>ติดตามอย่างโปร่งใส</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13.5, maxWidth: 440, lineHeight: 1.65, margin: 0 }}>
            ระบบสำหรับครู ผู้ปกครอง และฝ่ายปกครอง เพื่อบันทึกพฤติกรรมนักเรียน
            รวบรวมลายเซ็น และนำเสนอเพื่อพิจารณาตามขั้นตอน
          </p>
        </div>

        {/* Stats footer */}
        <div style={{
          position: "relative",
          display: "flex", gap: 36,
          paddingTop: 22, borderTop: "1px solid rgba(255,255,255,0.1)",
        }}>
          {[
            { num: "2,484", label: "นักเรียน" },
            { num: "2569",  label: "ปีการศึกษา" },
            { num: "86",    label: "ครูผู้ดูแล" },
          ].map(({ num, label }) => (
            <div key={label}>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 20, fontFamily: "var(--font-mono)", fontWeight: 400, marginBottom: 2 }}>{num}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-form-side" style={{ position: "relative" }}>

        {/* Theme toggle — top right */}
        <div style={{ position: "absolute", top: 20, right: 20 }}>
          <ThemeToggle />
        </div>

        <div style={{ width: "100%", maxWidth: 360 }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>§ เข้าสู่ระบบ</div>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", margin: "0 0 6px", color: "var(--ink)" }}>
              ยินดีต้อนรับกลับ
            </h2>
            <p style={{ color: "var(--ink-3)", margin: 0, fontSize: 13 }}>
              กรุณาใช้ชื่อผู้ใช้และรหัสผ่านที่ได้รับจากฝ่ายปกครอง
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <div style={{
            marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--rule)",
            display: "flex", justifyContent: "space-between",
            fontSize: 10.5, color: "var(--ink-4)",
            fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            <span>ระบบปกครอง · v 2.0</span>
            <span>ติดต่อฝ่ายไอที</span>
          </div>
        </div>
      </div>
    </div>
  )
}
