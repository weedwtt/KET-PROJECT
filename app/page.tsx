import { Suspense } from "react"
import Image from "next/image"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="login-screen">

      {/* ── Left — school photo panel ── */}
      <div className="login-art" style={{ padding: 0, background: "#0f172a", position: "relative", overflow: "hidden" }}>

        {/* Background photo */}
        <Image
          src="/school-bg.jpg"
          alt="โรงเรียนบางพลีราษฎร์บำรุง"
          fill
          style={{ objectFit: "cover", objectPosition: "center 40%" }}
          priority
        />

        {/* Gradient overlay — dark at top & bottom, lighter in middle */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.25) 40%, rgba(15,23,42,0.55) 70%, rgba(15,23,42,0.88) 100%)",
        }} />

        {/* ── Brand — top left ── */}
        <div style={{
          position: "absolute", top: 36, left: 40,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <Image
            src="/school-logo.png"
            alt="โลโก้โรงเรียน"
            width={52}
            height={52}
            style={{ objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
          />
          <div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 3,
            }}>
              EST · 2475
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              โรงเรียนบางพลีราษฎร์บำรุง
            </div>
          </div>
        </div>

      </div>

      {/* ── Right — form panel ── */}
      <div className="login-form-side" style={{ position: "relative", flexDirection: "column", gap: 0 }}>

        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* System title */}
          <div style={{ marginBottom: 40, textAlign: "center" }}>
            <Image
              src="/school-logo.png"
              alt="โลโก้โรงเรียน"
              width={64}
              height={64}
              style={{ objectFit: "contain", margin: "0 auto 16px", display: "block" }}
            />
            <div style={{
              display: "inline-block",
              fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em",
              color: "var(--ink-3)", textTransform: "uppercase",
              border: "1px solid var(--rule)", padding: "3px 12px",
              borderRadius: 99, marginBottom: 10,
            }}>
              โรงเรียนบางพลีราษฎร์บำรุง
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 6px", color: "var(--ink)" }}>
              ระบบบันทึกความประพฤตินักเรียน
            </h1>
            <p style={{ color: "var(--ink-3)", margin: 0, fontSize: 13 }}>
              เข้าสู่ระบบด้วยบัญชีที่ได้รับจากฝ่ายปกครอง
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
