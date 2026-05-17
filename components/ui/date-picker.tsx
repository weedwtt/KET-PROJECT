"use client"

import * as React from "react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value: string           // ISO date string "YYYY-MM-DD"
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "เลือกวันที่", className }: DatePickerProps) {
  const selected = value ? new Date(value) : undefined

  function handleSelect(day: Date | undefined) {
    if (!day) return
    const yyyy = day.getFullYear()
    const mm = String(day.getMonth() + 1).padStart(2, "0")
    const dd = String(day.getDate()).padStart(2, "0")
    onChange(`${yyyy}-${mm}-${dd}`)
  }

  const displayLabel = selected
    ? format(selected, "d MMMM yyyy", { locale: th })
    : null

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "ks-input flex items-center gap-2 text-left cursor-pointer w-full",
          !displayLabel && "text-[var(--ink-4)]",
          className
        )}
      >
        <CalendarIcon size={14} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{displayLabel ?? placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected ?? new Date()}
          captionLayout="dropdown"
          locale={th}
          startMonth={new Date(2000, 0)}
          endMonth={new Date(new Date().getFullYear() + 1, 11)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
