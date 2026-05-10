"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, X } from "lucide-react"
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

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1"
  const requiredMark = <span className="text-red-500 ml-0.5">*</span>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ข้อมูลพื้นฐาน */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#2D1B00] border-b border-gray-100 pb-2">ข้อมูลพื้นฐาน</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>คำนำหน้า{requiredMark}</label>
            <select value={form.titleId} onChange={set("titleId")} className={inputCls}>
              <option value="">— เลือก —</option>
              {titles.map((t) => (
                <option key={t.id} value={String(t.id)}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>ชื่อ{requiredMark}</label>
            <input value={form.firstName} onChange={set("firstName")} className={inputCls} placeholder="ชื่อ" />
          </div>
          <div>
            <label className={labelCls}>นามสกุล{requiredMark}</label>
            <input value={form.lastName} onChange={set("lastName")} className={inputCls} placeholder="นามสกุล" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>เบอร์โทรศัพท์{requiredMark}</label>
            <input value={form.phone} onChange={set("phone")} className={inputCls} placeholder="0XX-XXX-XXXX" />
          </div>
        </div>
      </div>

      {/* บทบาท */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#2D1B00] border-b border-gray-100 pb-2">บทบาทและตำแหน่ง</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>บทบาทในระบบ</label>
            <select value={form.role} onChange={set("role")} className={inputCls}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>หัวหน้าระดับชั้น</label>
            <select value={form.gradeHeadLevel} onChange={set("gradeHeadLevel")} className={inputCls}>
              {GRADE_HEAD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ลายเซ็น */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-bold text-[#2D1B00] border-b border-gray-100 pb-2">ลายเซ็น</h2>
        <SignaturePad
          value={form.signatureUrl || null}
          onChange={(data) => setForm((prev) => ({ ...prev, signatureUrl: data ?? "" }))}
        />
      </div>

      {/* ที่อยู่ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#2D1B00] border-b border-gray-100 pb-2">ที่อยู่</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>บ้านเลขที่{requiredMark}</label>
            <input value={form.addressHouseNo} onChange={set("addressHouseNo")} className={inputCls} placeholder="เช่น 123/4" />
          </div>
          <div>
            <label className={labelCls}>หมู่</label>
            <input value={form.addressMoo} onChange={set("addressMoo")} className={inputCls} placeholder="เช่น 5" />
          </div>
          <div>
            <label className={labelCls}>หมู่บ้าน/ชุมชน</label>
            <input value={form.addressVillage} onChange={set("addressVillage")} className={inputCls} placeholder="เช่น หมู่บ้านสุขสันต์" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>ซอย</label>
            <input value={form.addressSoi} onChange={set("addressSoi")} className={inputCls} placeholder="เช่น ลาดพร้าว 71" />
          </div>
          <div>
            <label className={labelCls}>ถนน</label>
            <input value={form.addressRoad} onChange={set("addressRoad")} className={inputCls} placeholder="เช่น ลาดพร้าว" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>ตำบล/แขวง{requiredMark}</label>
            <input value={form.addressSubDistrict} onChange={set("addressSubDistrict")} className={inputCls} placeholder="ตำบล" />
          </div>
          <div>
            <label className={labelCls}>อำเภอ/เขต{requiredMark}</label>
            <input value={form.addressDistrict} onChange={set("addressDistrict")} className={inputCls} placeholder="อำเภอ" />
          </div>
          <div>
            <label className={labelCls}>จังหวัด{requiredMark}</label>
            <input value={form.addressProvince} onChange={set("addressProvince")} className={inputCls} placeholder="จังหวัด" />
          </div>
          <div>
            <label className={labelCls}>รหัสไปรษณีย์{requiredMark}</label>
            <input
              value={form.addressPostalCode}
              onChange={set("addressPostalCode")}
              className={inputCls}
              placeholder="10000"
              maxLength={5}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push(backUrl)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#F5A623] text-[#1a1a1a] text-sm font-semibold hover:bg-[#e8951f] transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มครู" : "บันทึกการแก้ไข"}
        </button>
      </div>
    </form>
  )
}
