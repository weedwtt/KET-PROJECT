"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Pen, Trash2, RotateCcw, Upload, ImageIcon } from "lucide-react"

interface SignaturePadProps {
  value?: string | null
  onChange: (data: string | null) => void
  disabled?: boolean
}

type Method = "draw" | "upload"

// ขนาดสูงสุดของรูปลายเซ็นที่อัปโหลด (px) — ให้พอ ๆ กับ canvas เซ็นสด
const MAX_W = 520
const MAX_H = 200
// ไฟล์ใหญ่สุดที่ยอมรับก่อนประมวลผล
const MAX_FILE_BYTES = 5 * 1024 * 1024
// พิกเซลที่ทุกช่องสี (R,G,B) สว่างเกินค่านี้ถือเป็นพื้นหลังขาว → ทำให้โปร่งใส
const WHITE_THRESHOLD = 235

export function SignaturePad({ value, onChange, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  // view: "show" = แสดงลายเซ็นที่มีอยู่, "edit" = กำลังเซ็น/อัปโหลด
  const [view, setView] = useState<"show" | "edit">(value ? "show" : "edit")
  const [method, setMethod] = useState<Method>("draw")
  const [uploadError, setUploadError] = useState("")
  const [processing, setProcessing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const isDrawingActive = view === "edit" && method === "draw"

  // Initialize canvas — keep it transparent so the exported PNG has no
  // white background (the white box / guide line are CSS only, not drawn
  // onto the canvas, otherwise they get baked into toDataURL and cover
  // the lines in the generated PDF).
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }, [])

  useEffect(() => {
    if (isDrawingActive) {
      initCanvas()
    }
  }, [isDrawingActive, initCanvas])

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
    if (!canvas || !isDrawingActive) return

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
  }, [isDrawingActive, startDraw, draw, endDraw])

  function handleClear() {
    initCanvas()
    onChange(null)
  }

  // เริ่มเซ็น/อัปโหลดใหม่จากหน้าแสดงผล
  function startEdit(m: Method) {
    setUploadError("")
    onChange(null)
    setMethod(m)
    setView("edit")
  }

  function switchMethod(m: Method) {
    if (m === method) return
    setUploadError("")
    onChange(null)
    setMethod(m)
  }

  // โหลดรูปจาก data URL เป็น HTMLImageElement
  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์รูปได้"))
      img.src = src
    })
  }

  // อ่านไฟล์ → ย่อขนาด → ลบพื้นหลังขาวให้โปร่งใส → ส่งออกเป็น PNG data URL
  async function processFile(file: File) {
    setUploadError("")

    if (!file.type.startsWith("image/")) {
      setUploadError("กรุณาเลือกไฟล์รูปภาพ")
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("ไฟล์ใหญ่เกินไป (จำกัด 5MB)")
      return
    }

    setProcessing(true)
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"))
        reader.readAsDataURL(file)
      })

      const img = await loadImage(dataUrl)

      // ย่อขนาดคงสัดส่วน
      const scale = Math.min(1, MAX_W / img.width, MAX_H / img.height)
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("ไม่รองรับการประมวลผลรูป")
      ctx.drawImage(img, 0, 0, width, height)

      // ลบพื้นหลังขาว → โปร่งใส
      const imageData = ctx.getImageData(0, 0, width, height)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > WHITE_THRESHOLD && d[i + 1] > WHITE_THRESHOLD && d[i + 2] > WHITE_THRESHOLD) {
          d[i + 3] = 0
        }
      }
      ctx.putImageData(imageData, 0, 0)

      const out = canvas.toDataURL("image/png")
      onChange(out)
      setView("show")
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการประมวลผลรูป")
    } finally {
      setProcessing(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = "" // เปิดให้เลือกไฟล์เดิมซ้ำได้
  }

  // ───────── แสดงลายเซ็นที่มีอยู่ ─────────
  if (view === "show" && value) {
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
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <button
                type="button"
                onClick={() => startEdit("draw")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                เซ็นใหม่
              </button>
              <button
                type="button"
                onClick={() => startEdit("upload")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                อัปโหลดรูปใหม่
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ───────── โหมดเซ็น / อัปโหลด ─────────
  return (
    <div className="space-y-2">
      {/* สลับวิธี: เซ็นสด / อัปโหลดรูป — รูปแบบเดียวกับ /record/statement/new */}
      {!disabled && (
        <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", borderRadius: "var(--radius)", padding: 3, width: "fit-content" }}>
          <button
            type="button"
            onClick={() => switchMethod("draw")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", fontSize: 12, borderRadius: "calc(var(--radius) - 2px)", border: "none",
              cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
              background: method === "draw" ? "var(--surface)" : "transparent",
              color: method === "draw" ? "var(--ink)" : "var(--ink-3)",
              boxShadow: method === "draw" ? "0 1px 3px rgba(37,99,235,.12)" : "none",
            }}
          >
            <Pen size={13} />
            เซ็นสด
          </button>
          <button
            type="button"
            onClick={() => switchMethod("upload")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", fontSize: 12, borderRadius: "calc(var(--radius) - 2px)", border: "none",
              cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
              background: method === "upload" ? "var(--surface)" : "transparent",
              color: method === "upload" ? "var(--ink)" : "var(--ink-3)",
              boxShadow: method === "upload" ? "0 1px 3px rgba(37,99,235,.12)" : "none",
            }}
          >
            <Upload size={13} />
            อัปโหลดรูป
          </button>
        </div>
      )}

      {method === "draw" ? (
        <>
          <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* guide line — CSS only, not drawn onto the canvas */}
            <div
              className="absolute left-5 right-5 pointer-events-none"
              style={{ bottom: "24px", borderTop: "1px solid #f0e8d8" }}
            />
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
        </>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={disabled || processing}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || processing}
            className="w-full border border-dashed border-gray-300 rounded-lg bg-white px-4 py-8 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ minHeight: "120px" }}
          >
            {processing ? (
              <>
                <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                  <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs">กำลังประมวลผลรูป...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs">คลิกเพื่อเลือกรูปลายเซ็น</span>
                <span className="text-[11px] text-gray-300">PNG, JPG, WEBP — ระบบจะลบพื้นหลังขาวให้อัตโนมัติ</span>
              </>
            )}
          </button>
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          {!uploadError && !processing && (
            <p className="text-xs text-gray-400">แนะนำรูปลายเซ็นพื้นหลังขาว เพื่อให้ลบพื้นหลังได้สะอาด</p>
          )}
        </>
      )}
    </div>
  )
}
