"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-[#F5A623] font-medium text-sm">
          Username
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </span>
          <Input
            id="username"
            type="text"
            placeholder="กรอก Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="pl-9 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-[#F5A623] text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
          Password
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <Input
            id="password"
            type="password"
            placeholder="กรอก Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-9 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-[#F5A623] text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#F5A623] hover:bg-[#e09518] text-white font-semibold py-5 text-sm sm:text-base cursor-pointer"
      >
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </Button>
    </form>
  )
}
