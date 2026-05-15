"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div style={{ width: 34, height: 34 }} />

  const isDark = theme === "dark"

  return (
    <button
      className={`icon-btn ${className ?? ""}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "เปลี่ยนเป็น Light mode" : "เปลี่ยนเป็น Dark mode"}
      aria-label="toggle theme"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
