"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [shaking, setShaking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await signIn("credentials", { username, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
      setShaking(true)
      setTimeout(() => setShaking(false), 400)
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }} className={shaking ? "login-shake" : ""}>
        <label htmlFor="username" className="field-label">ชื่อผู้ใช้</label>
        <input
          id="username"
          className="ks-input"
          type="text"
          placeholder="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div style={{ marginBottom: 24 }} className={shaking ? "login-shake" : ""}>
        <label htmlFor="password" className="field-label">รหัสผ่าน</label>
        <input
          id="password"
          className="ks-input"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <div
          key={error}
          role="alert"
          className="login-error"
          style={{
            marginBottom: 16, padding: "10px 14px",
            background: "var(--rose-wash)",
            border: "1px solid var(--rose)",
            borderRadius: "var(--radius)",
            fontSize: 13.5, color: "var(--rose)",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.5 : 1 }}
      >
        {loading ? (
          <>
            <svg className="spin" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
              <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            กำลังเข้าสู่ระบบ...
          </>
        ) : "เข้าสู่ระบบ"}
      </button>
    </form>
  )
}
