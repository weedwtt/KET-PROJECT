"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string                       // "HH:MM" แบบ 24 ชม. หรือ ""
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

// ช่องกรอกเวลาแบบ 24 ชม. (ไม่มี AM/PM) — รับ/คืนค่าเป็น "HH:MM" เหมือน input type="time"
// แต่บังคับรูปแบบเองเพื่อให้แสดง 24 ชม. เสมอทุกเบราว์เซอร์/locale
export function TimePicker({ value, onChange, placeholder = "HH:MM", className }: TimePickerProps) {
  const [text, setText] = React.useState(value)

  // sync เมื่อค่าจากภายนอกเปลี่ยน (เช่น โหลดข้อมูลมาเติม)
  React.useEffect(() => { setText(value) }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4)
    let hh = digits.slice(0, 2)
    let mm = digits.slice(2, 4)

    // clamp ระหว่างพิมพ์ (เฉพาะเมื่อครบ 2 หลัก)
    if (hh.length === 2 && Number(hh) > 23) hh = "23"
    if (mm.length === 2 && Number(mm) > 59) mm = "59"

    const next = mm.length > 0 || digits.length > 2 ? `${hh}:${mm}` : hh
    setText(next)
    onChange(isComplete(next) ? next : "")
  }

  function handleBlur() {
    const digits = text.replace(/\D/g, "")
    if (digits.length === 0) { setText(""); onChange(""); return }
    let h = Number(digits.slice(0, 2))
    let m = Number(digits.slice(2, 4) || "0")
    if (isNaN(h)) h = 0
    if (isNaN(m)) m = 0
    h = Math.min(23, h)
    m = Math.min(59, m)
    const padded = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    setText(padded)
    onChange(padded)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className={cn("ks-input", className)}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      maxLength={5}
    />
  )
}

function isComplete(v: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
}
