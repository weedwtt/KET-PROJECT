// ── เวลา/วันที่ของ "เหตุเกิด" (incidentAt) ───────────────────────────────────────
// เราปฏิบัติกับ incidentAt เป็น "wall-clock" คือ ค่าวัน-เวลาที่ผู้ใช้พิมพ์ ตรงตัว
// ไม่ผูกกับ timezone — เก็บและอ่านเป็น UTC อย่างสม่ำเสมอ เพื่อให้เวลาที่พิมพ์
// round-trip ตรงเสมอ ไม่ว่า server/browser จะอยู่ timezone ใด
//
// ⚠️ ใช้ helper เหล่านี้เฉพาะกับ incidentAt เท่านั้น — recordDate/approvedAt เป็น
// instant จริง (เวลาที่บันทึก/อนุมัติ) ให้คงฟอร์แมตตาม local เดิมไว้

export const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

const pad = (n: number) => String(n).padStart(2, "0")

// รับสตริง "YYYY-MM-DDTHH:MM" จากฟอร์ม แล้วเก็บเป็น instant ที่ตัวเลข wall-clock
// ตรงตัว (ผนวก Z ให้ parse เป็น UTC) — เช่น "2026-06-15T14:30" → 2026-06-15T14:30:00.000Z
export function parseIncidentDateTime(s: string | null | undefined): Date | null {
  if (!s) return null
  const base = s.slice(0, 16) // YYYY-MM-DDTHH:MM
  const d = new Date(`${base}:00.000Z`)
  return isNaN(d.getTime()) ? null : d
}

// แปลง Date/ISO ที่เก็บไว้ กลับเป็น "YYYY-MM-DDTHH:MM" สำหรับเติมลงฟอร์ม (อ่านแบบ UTC)
export function incidentToInputValue(d: Date | string | null | undefined): string {
  if (!d) return ""
  const dt = typeof d === "string" ? new Date(d) : d
  if (isNaN(dt.getTime())) return ""
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`
}

export function thaiIncidentDateParts(d: Date | string | null | undefined) {
  if (!d) return { day: "", month: "", year: "" }
  const dt = typeof d === "string" ? new Date(d) : d
  if (isNaN(dt.getTime())) return { day: "", month: "", year: "" }
  return {
    day: String(dt.getUTCDate()),
    month: THAI_MONTHS[dt.getUTCMonth()],
    year: String(dt.getUTCFullYear() + 543),
  }
}

// "HH.MM" (รูปแบบไทยใช้จุดคั่น)
export function thaiIncidentTime(d: Date | string | null | undefined): string {
  if (!d) return ""
  const dt = typeof d === "string" ? new Date(d) : d
  if (isNaN(dt.getTime())) return ""
  return `${pad(dt.getUTCHours())}.${pad(dt.getUTCMinutes())}`
}

// สตริงเต็มสำหรับแสดงบนหน้าจอ เช่น "15 มิถุนายน 2569 · 14:30 น."
export function formatThaiIncidentDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—"
  const dt = typeof d === "string" ? new Date(d) : d
  if (isNaN(dt.getTime())) return "—"
  const { day, month, year } = thaiIncidentDateParts(dt)
  const time = `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`
  return `${day} ${month} ${year} · ${time} น.`
}
