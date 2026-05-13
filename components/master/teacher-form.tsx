"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SignaturePad } from "@/components/ui/signature-pad"

type TeacherTitle = { id: number; name: string }

const ROLE_OPTIONS = [
  { value: "", label: "— ไม่ระบุ —" },
  { value: "TEACHER", label: "ครู" },
  { value: "DIRECTOR", label: "ผอ." },
  { value: "VICE_DIRECTOR", label: "รองผอ." },
  { value: "ADMIN", label: "admin" },
]

const GRADE_HEAD_OPTIONS = [
  { value: "", label: "— ไม่ใช่หัวหน้าระดับชั้น —" },
  { value: "M1", label: "ม.1" },
  { value: "M2", label: "ม.2" },
  { value: "M3", label: "ม.3" },
  { value: "M4", label: "ม.4" },
  { value: "M5", label: "ม.5" },
  { value: "M6", label: "ม.6" },
]

type TeacherFormData = {
  titleId: string
  firstName: string
  lastName: string
  phone: string
  role: string
  gradeHeadLevel: string
  signatureUrl: string
  addressHouseNo: string
  addressMoo: string
  addressVillage: string
  addressRoad: string
  addressSoi: string
  addressSubDistrict: string
  addressDistrict: string
  addressProvince: string
  addressPostalCode: string
}

type Props = {
  initialData?: Partial<TeacherFormData> & { id?: number }
  mode: "create" | "edit"
  backUrl?: string
}

const EMPTY: TeacherFormData = {
  titleId: "",
  firstName: "",
  lastName: "",
  phone: "",
  role: "",
  gradeHeadLevel: "",
  signatureUrl: "",
  addressHouseNo: "",
  addressMoo: "",
  addressVillage: "",
  addressRoad: "",
  addressSoi: "",
  addressSubDistrict: "",
  addressDistrict: "",
  addressProvince: "",
  addressPostalCode: "",
}

export function TeacherForm({ initialData, mode, backUrl = "/dashboard/master/teachers" }: Props) {
  const router = useRouter()
  const [titles, setTitles] = useState<TeacherTitle[]>([])
  const [form, setForm] = useState<TeacherFormData>({ ...EMPTY, ...initialData })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/master/teacher-titles")
      .then((r) => r.json())
      .then(setTitles)
      .catch(() => {})
  }, [])

  const set = (field: keyof TeacherFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titleId || !form.firstName || !form.lastName || !form.phone) {
      setError("กรุณากรอกข้อมูลที่จำเป็น: คำนำหน้า, ชื่อ, นามสกุล, เบอร์โทร")
      return
    }
    if (!form.addressHouseNo || !form.addressSubDistrict || !form.addressDistrict || !form.addressProvince || !form.addressPostalCode) {
      setError("กรุณากรอกที่อยู่ให้ครบ")
      return
    }

    setSaving(true)
    setError("")

    try {
      const payload = {
        ...form,
        role: form.role || null,
        gradeHeadLevel: form.gradeHeadLevel || null,
      }

      const url = mode === "edit" && initialData?.id ? `/api/master/teachers/${initialData.id}` : "/api/master/teachers"
      const method = mode === "edit" ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "เกิดข้อผิดพลาด")
      }

      router.push(backUrl)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด")
    } finally {
      setSaving(false)
    }
  }

  const lbl = (text: string, required?: boolean) => (
    <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 5 }}>
      {text}{required && <span style={{ color: "var(--rose)", marginLeft: 2 }}>*</span>}
    </label>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && (
        <div style={{ display: "flex", gap: 8, background: "color-mix(in srgb, var(--rose) 8%, white)", border: "1px solid color-mix(in srgb, var(--rose) 25%, white)", borderRadius: 8, padding: "10px 14px" }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--rose)" style={{ flexShrink: 0, marginTop: 1 }}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
          <span style={{ fontSize: 13, color: "var(--rose)" }}>{error}</span>
        </div>
      )}

      {/* ข้อมูลพื้นฐาน */}
      <div className="ks-card">
        <div className="ks-card-header"><span className="num">§1</span><span>ข้อมูลพื้นฐาน</span></div>
        <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              {lbl("คำนำหน้า", true)}
              <select value={form.titleId} onChange={set("titleId")} className="ks-select">
                <option value="">— เลือก —</option>
                {titles.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
              </select>
            </div>
            <div>
              {lbl("ชื่อ", true)}
              <input value={form.firstName} onChange={set("firstName")} className="ks-input" placeholder="ชื่อ" />
            </div>
            <div>
              {lbl("นามสกุล", true)}
              <input value={form.lastName} onChange={set("lastName")} className="ks-input" placeholder="นามสกุล" />
            </div>
          </div>
          <div style={{ maxWidth: 300 }}>
            {lbl("เบอร์โทรศัพท์", true)}
            <input value={form.phone} onChange={set("phone")} className="ks-input" placeholder="0XX-XXX-XXXX" />
          </div>
        </div>
      </div>

      {/* บทบาท */}
      <div className="ks-card">
        <div className="ks-card-header"><span className="num">§2</span><span>บทบาทและตำแหน่ง</span></div>
        <div className="ks-card-pad" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            {lbl("บทบาทในระบบ")}
            <select value={form.role} onChange={set("role")} className="ks-select">
              {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            {lbl("หัวหน้าระดับชั้น")}
            <select value={form.gradeHeadLevel} onChange={set("gradeHeadLevel")} className="ks-select">
              {GRADE_HEAD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ลายเซ็น */}
      <div className="ks-card">
        <div className="ks-card-header"><span className="num">§3</span><span>ลายเซ็น</span></div>
        <div className="ks-card-pad">
          <SignaturePad
            value={form.signatureUrl || null}
            onChange={(data) => setForm((prev) => ({ ...prev, signatureUrl: data ?? "" }))}
          />
        </div>
      </div>

      {/* ที่อยู่ */}
      <div className="ks-card">
        <div className="ks-card-header"><span className="num">§4</span><span>ที่อยู่</span></div>
        <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              {lbl("บ้านเลขที่", true)}
              <input value={form.addressHouseNo} onChange={set("addressHouseNo")} className="ks-input" placeholder="เช่น 123/4" />
            </div>
            <div>
              {lbl("หมู่")}
              <input value={form.addressMoo} onChange={set("addressMoo")} className="ks-input" placeholder="เช่น 5" />
            </div>
            <div>
              {lbl("หมู่บ้าน/ชุมชน")}
              <input value={form.addressVillage} onChange={set("addressVillage")} className="ks-input" placeholder="เช่น หมู่บ้านสุขสันต์" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              {lbl("ซอย")}
              <input value={form.addressSoi} onChange={set("addressSoi")} className="ks-input" placeholder="เช่น ลาดพร้าว 71" />
            </div>
            <div>
              {lbl("ถนน")}
              <input value={form.addressRoad} onChange={set("addressRoad")} className="ks-input" placeholder="เช่น ลาดพร้าว" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              {lbl("ตำบล/แขวง", true)}
              <input value={form.addressSubDistrict} onChange={set("addressSubDistrict")} className="ks-input" placeholder="ตำบล" />
            </div>
            <div>
              {lbl("อำเภอ/เขต", true)}
              <input value={form.addressDistrict} onChange={set("addressDistrict")} className="ks-input" placeholder="อำเภอ" />
            </div>
            <div>
              {lbl("จังหวัด", true)}
              <input value={form.addressProvince} onChange={set("addressProvince")} className="ks-input" placeholder="จังหวัด" />
            </div>
            <div>
              {lbl("รหัสไปรษณีย์", true)}
              <input value={form.addressPostalCode} onChange={set("addressPostalCode")} className="ks-input" placeholder="10000" maxLength={5} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button type="button" onClick={() => router.push(backUrl)} className="btn btn-ghost">
          ยกเลิก
        </button>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? (
            <>
              <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/>
                <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              กำลังบันทึก...
            </>
          ) : mode === "create" ? "เพิ่มครู" : "บันทึกการแก้ไข"}
        </button>
      </div>
    </form>
  )
}
