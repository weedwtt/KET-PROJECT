import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="login-screen">
      {/* Left — art panel */}
      <div className="login-art">
        <div className="login-art-grid" />

        {/* Brand */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20,
          }}>บพ</div>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
              EST · 2475
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>โรงเรียนบางพลีราษฎร์บำรุง</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: "relative", marginTop: "auto", marginBottom: 80 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 16 }}>
            § ระบบบันทึกความประพฤตินักเรียน
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 500, lineHeight: 1.22, letterSpacing: "-0.018em", margin: 0, maxWidth: 520 }}>
            บันทึกอย่างเป็นระเบียบ<br />
            อนุมัติอย่างเป็นธรรม<br />
            <span style={{ color: "var(--periwinkle)" }}>ติดตามอย่างโปร่งใส</span>
          </h1>
          <p style={{ marginTop: 22, color: "rgba(255,255,255,0.65)", fontSize: 14, maxWidth: 460, lineHeight: 1.6 }}>
            ระบบสำหรับครู ผู้ปกครอง และฝ่ายปกครอง เพื่อบันทึกพฤติกรรมนักเรียน รวบรวมลายเซ็น และนำเสนอเพื่อพิจารณาตามขั้นตอน
          </p>
        </div>

        {/* Stats footer */}
        <div style={{
          position: "relative",
          display: "flex", gap: 32,
          paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.12)",
          fontFamily: "var(--font-mono)", fontSize: 11,
          color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 22, fontFamily: "var(--font-mono)", marginBottom: 2 }}>2,484</div>
            นักเรียน
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 22, fontFamily: "var(--font-mono)", marginBottom: 2 }}>2569</div>
            ปีการศึกษา
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="login-form-side">
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>§ เข้าสู่ระบบ</div>
          <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 8px" }}>
            ยินดีต้อนรับกลับ
          </h2>
          <p style={{ color: "var(--ink-3)", margin: "0 0 32px", fontSize: 13.5 }}>
            กรุณาใช้ชื่อผู้ใช้และรหัสผ่านที่ได้รับจากฝ่ายปกครอง
          </p>

          <Suspense>
            <LoginForm />
          </Suspense>

          <div style={{
            marginTop: 36, paddingTop: 22, borderTop: "1px solid var(--rule)",
            display: "flex", justifyContent: "space-between",
            fontSize: 11, color: "var(--ink-3)",
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
