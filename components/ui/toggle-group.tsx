"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ใช้ plain CSS เพื่อให้ active state (data-pressed) ทำงานแน่นอน
// — Tailwind data-attribute modifier ทำงานไม่สม่ำเสมอกับ attribute ที่ไม่มีค่า
const STYLE_ID = "ks-toggle-group-style"

function injectStyle() {
  if (typeof document === "undefined") return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement("style")
  el.id = STYLE_ID
  el.textContent = `
.ks-tg-item {
  background: #fff;
  color: var(--ink-3, #475569);
  border-color: var(--line, #e5e7eb);
}
.ks-tg-item:hover:not([data-pressed]):not(:disabled) {
  background: var(--indigo-wash, #eff5ff);
  color: var(--indigo-ink, #1e3a8a);
}
.ks-tg-item[data-pressed] {
  background: var(--indigo, #2563eb) !important;
  color: #ffffff !important;
  border-color: var(--indigo, #2563eb) !important;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.25);
}
.ks-tg-item[data-pressed] svg {
  color: #ffffff !important;
}
.ks-tg-item:focus-visible {
  outline: 2px solid var(--indigo, #2563eb);
  outline-offset: 2px;
  z-index: 1;
}
`
  document.head.appendChild(el)
}

const toggleVariants = cva(
  "ks-tg-item inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors outline-none rounded-md disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-transparent",
        outline: "border",
      },
      size: {
        default: "h-9 px-5 text-xs",
        sm: "h-8 px-4 text-xs",
        lg: "h-10 px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
)

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  variant: "outline",
  size: "default",
})

function ToggleGroup<Value extends string>({
  className,
  variant,
  size,
  children,
  ...props
}: ToggleGroupPrimitive.Props<Value> & VariantProps<typeof toggleVariants>) {
  React.useEffect(() => {
    injectStyle()
  }, [])

  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn("inline-flex w-fit items-center gap-2", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem<Value extends string>({
  className,
  children,
  variant,
  size,
  ...props
}: TogglePrimitive.Props<Value> & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)
  const v = context.variant ?? variant
  const s = context.size ?? size

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(toggleVariants({ variant: v, size: s }), className)}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

export { ToggleGroup, ToggleGroupItem, toggleVariants }
