"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Pen, Trash2, RotateCcw } from "lucide-react"

interface SignaturePadProps {
  value?: string | null
  onChange: (data: string | null) => void
  disabled?: boolean
}

export function SignaturePad({ value, onChange, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [mode, setMode] = useState<"show" | "draw">(value ? "show" : "draw")
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Initialize canvas with white background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // subtle guide line
    ctx.strokeStyle = "#f0e8d8"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, canvas.height - 24)
    ctx.lineTo(canvas.width - 20, canvas.height - 24)
    ctx.stroke()
    setHasSignature(false)
  }, [])

  useEffect(() => {
    if (mode === "draw") {
      initCanvas()
    }
  }, [mode, initCanvas])

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    setDrawing(true)
    lastPos.current = getPos(e, canvas)
  }, [disabled])

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!drawing || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx || !lastPos.current) return

    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
    lastPos.current = pos
    setHasSignature(true)
  }, [drawing, disabled])

  const endDraw = useCallback(() => {
    if (!drawing) return
    setDrawing(false)
    lastPos.current = null
    const canvas = canvasRef.current
    if (!canvas) return
    const data = canvas.toDataURL("image/png")
    onChange(data)
  }, [drawing, onChange])

  // Attach canvas events
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || mode !== "draw") return

    canvas.addEventListener("mousedown", startDraw)
    canvas.addEventListener("mousemove", draw)
    canvas.addEventListener("mouseup", endDraw)
    canvas.addEventListener("mouseleave", endDraw)
    canvas.addEventListener("touchstart", startDraw, { passive: false })
    canvas.addEventListener("touchmove", draw, { passive: false })
    canvas.addEventListener("touchend", endDraw)

    return () => {
      canvas.removeEventListener("mousedown", startDraw)
      canvas.removeEventListener("mousemove", draw)
      canvas.removeEventListener("mouseup", endDraw)
      canvas.removeEventListener("mouseleave", endDraw)
      canvas.removeEventListener("touchstart", startDraw)
      canvas.removeEventListener("touchmove", draw)
      canvas.removeEventListener("touchend", endDraw)
    }
  }, [mode, startDraw, draw, endDraw])

  function handleClear() {
    initCanvas()
    onChange(null)
  }

  function handleRedo() {
    onChange(null)
    setMode("draw")
  }

  // show existing signature
  if (mode === "show" && value) {
    return (
      <div className="space-y-2">
        <div className="border border-gray-200 rounded-lg bg-white p-3 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="ลายเซ็น"
            className="h-16 object-contain"
            style={{ maxWidth: "260px" }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRedo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors ml-3 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              เซ็นใหม่
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* hint label */}
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-1.5 text-gray-300 text-xs select-none">
              <Pen className="w-3.5 h-3.5" />
              เซ็นชื่อในกรอบนี้
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={520}
          height={160}
          className={`w-full block ${disabled ? "opacity-60" : "cursor-crosshair touch-none"}`}
          style={{ height: "120px" }}
        />
      </div>

      {!disabled && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">ใช้เมาส์หรือนิ้วเซ็นในกรอบด้านบน</p>
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasSignature}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ล้าง
          </button>
        </div>
      )}
    </div>
  )
}
