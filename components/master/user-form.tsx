"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, X, Eye, EyeOff } from "lucide-react"
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

type FormData = {
  // user fields
  username: string
  password: string
  confirmPassword: string
  // teacher fields
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
  mode: "create" | "edit"
  initialData?: Partial<FormData> & { userId?: number; teacherId?: number }
  backUrl?: string
}

const EMPTY: FormData = {
  username: "",
  password: "",
  confirmPassword: "",
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

export function UserForm({ mode, initialData, backUrl = "/dashboard/master/users" }: Props) {
  const router = useRouter()
  const [titles, setTitles] = useState<TeacherTitle[]>([])
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initialData })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    fetch("/api/master/teacher-titles")
      .then((r) => r.json())
      .then(setTitles)
      .catch(() => {})
  }, [])

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.username) return setError("กรุณาระบุชื่อผู้ใช้")
    if (mode === "create" && !form.password) return setError("กรุณาระบุรหัสผ่าน")
    if (form.password && form.password !== form.confirmPassword) return setError("รหัสผ่านไม่ตรงกัน")
    if (!form.titleId || !form.firstName || !form.lastName || !form.phone) {
      return setError("กรุณากรอกข้อมูลครูให้ครบ: คำนำหน้า, ชื่อ, นามสกุล, เบอร์โทร")
    }
    if (
      !form.addressHouseNo ||
      !form.addressSubDistrict ||
      !form.addressDistrict ||
      !form.addressProvince ||
      !form.addressPostalCode
    ) {
      return setError("กรุณากรอกที่อยู่ให้ครบ")
    }

    setSaving(true)
    setError("")

    try {
      const payload =
        mode === "create"
          ? {
              username: form.username,
              password: form.password,
              titleId: form.titleId,
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone,
              role: form.role || null,
              gradeHeadLevel: form.gradeHeadLevel || null,
              signatureUrl: form.signatureUrl || null,
              addressHouseNo: form.addressHouseNo,
              addressMoo: form.addressMoo || null,
              addressVillage: form.addressVillage || null,
              addressRoad: form.addressRoad || null,
              addressSoi: form.addressSoi || null,
              addressSubDistrict: form.addressSubDistrict,
              addressDistrict: form.addressDistrict,
              addressProvince: form.addressProvince,
              addressPostalCode: form.addressPostalCode,
            }
          : {
              username: form.username,
              ...(form.password ? { password: form.password } : {}),
              teacherId: initialData?.teacherId,
              titleId: form.titleId,
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone,
              role: form.role || null,
              gradeHeadLevel: form.gradeHeadLevel || null,
              signatureUrl: form.signatureUrl || null,
              addressHouseNo: form.addressHouseNo,
              addressMoo: form.addressMoo || null,
              addressVillage: form.addressVillage || null,
              addressRoad: form.addressRoad || null,
              addressSoi: form.addressSoi || null,
              addressSubDistrict: form.addressSubDistrict,
              addressDistrict: form.addressDistrict,
              addressProvince: form.addressProvince,
              addressPostalCode: form.addressPostalCode,
            }

      const url = mode === "edit" && initialData?.userId ? `/api/master/users/${initialData.userId}` : "/api/master/users"
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

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1"
  const requiredMark = <span className="text-red-500 ml-0.5">*</span>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* บัญชีผู้ใช้ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#2D1B00] border-b border-gray-100 pb-2">บัญชีผู้ใช้งาน</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>ชื่อผู้ใช้ (username){requiredMark}</label>
            <input value={form.username} onChange={set("username")} className={inputCls} placeholder="ชื่อผู้ใช้" autoComplete="off" />
          </div>
          <div>
            <label className={labelCls}>
              รหัสผ่าน{mode === "create" && requiredMark}
              {mode === "edit" && <span className="ml-1 font-normal text-gray-400">(เว้นว่างหากไม่เปลี่ยน)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                className={inputCls + " pr-9"}
                placeholder="รหัสผ่าน"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>ยืนยันรหัสผ่าน{mode === "create" && requiredMark}</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                className={inputCls + " pr-9"}
                placeholder="ยืนยันรหัสผ่าน"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ข้อมูลพื้นฐาน */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#2D1B00] border-b border-gray-100 pb-2">ข้อมูลครู</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>คำนำหน้า{requiredMark}</label>
            <select value={form.titleId} onChange={set("titleId")} className={inputCls}>
              <option value="">— เลือก —</option>
              {titles.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
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
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>หัวหน้าระดับชั้น</label>
            <select value={form.gradeHeadLevel} onChange={set("gradeHeadLevel")} className={inputCls}>
              {GRADE_HEAD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
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
            <input value={form.addressVillage} onChange={set("addressVillage")} className={inputCls} placeholder="หมู่บ้านสุขสันต์" />
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
          {saving ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มผู้ใช้" : "บันทึกการแก้ไข"}
        </button>
      </div>
    </form>
  )
}
