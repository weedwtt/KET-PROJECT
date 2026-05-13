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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await signIn("credentials", { username, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
      return
    }
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label className="field-label">ชื่อผู้ใช้</label>
        <input
          className="ks-input"
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label className="field-label">รหัสผ่าน</label>
        <input
          className="ks-input"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: "10px 14px",
          background: "var(--rose-wash)", borderRadius: "var(--radius)",
          fontSize: 13, color: "var(--rose)",
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  )
}
