"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, X } from "lucide-react"
import { toast } from "sonner"
import { SignaturePad } from "@/components/ui/signature-pad"

type TeacherTitle = { id: number; name: string }
type TeacherOption = { id: number; name: string }

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
  username: string
  password: string
  confirmPassword: string
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

  // Delegate state
  const [delegateTeacherIds, setDelegateTeacherIds] = useState<number[]>([])
  const [allTeachers, setAllTeachers] = useState<TeacherOption[]>([])
  const [loadingDelegates, setLoadingDelegates] = useState(false)

  const isDirectorOrVice = form.role === "DIRECTOR" || form.role === "VICE_DIRECTOR"
  const showDelegateSection = mode === "edit" && isDirectorOrVice && !!initialData?.teacherId

  useEffect(() => {
    fetch("/api/master/teacher-titles")
      .then((r) => r.json())
      .then(setTitles)
      .catch(() => {})
  }, [])

  // โหลด delegate ปัจจุบันและรายชื่อครูทั้งหมด เมื่อ section ถูกแสดง
  useEffect(() => {
    if (!showDelegateSection) return
    setLoadingDelegates(true)
    Promise.all([
      fetch(`/api/master/users/${initialData!.userId}`)
        .then((r) => r.json()),
      fetch("/api/master/users?all=true")
        .then((r) => r.json()),
    ]).then(([userData, usersData]) => {
      const delegates: { delegate: { id: number } }[] = userData.teacher?.delegatedTo ?? []
      setDelegateTeacherIds(delegates.map((d) => d.delegate.id))

      type UserRow = { username: string; teacherId: number | null; teacher: { id: number; firstName: string; lastName: string; title: { name: string } } | null }
      const rows: UserRow[] = usersData.rows ?? []
      setAllTeachers(
        rows
          .filter((u) => u.teacherId != null && u.teacherId !== initialData!.teacherId)
          .map((u) => ({
            id: u.teacher!.id,
            name: `${u.username} — ${u.teacher!.title.name}${u.teacher!.firstName} ${u.teacher!.lastName}`,
          }))
      )
      setLoadingDelegates(false)
    }).catch(() => setLoadingDelegates(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDelegateSection])

  function addDelegate(teacherId: number) {
    if (!teacherId || delegateTeacherIds.includes(teacherId)) return
    setDelegateTeacherIds((prev) => [...prev, teacherId])
  }

  function removeDelegate(teacherId: number) {
    setDelegateTeacherIds((prev) => prev.filter((id) => id !== teacherId))
  }

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
              // ส่ง delegates เฉพาะตอน edit และเป็น DIRECTOR/VICE_DIRECTOR
              ...(showDelegateSection ? { delegateTeacherIds } : {}),
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

      toast.success(mode === "create" ? "เพิ่มผู้ใช้สำเร็จ" : "บันทึกการแก้ไขสำเร็จ")
      router.push(backUrl)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด"
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const lbl = (text: string, required?: boolean, hint?: string) => (
    <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 5 }}>
      {text}
      {required && <span style={{ color: "var(--rose)", marginLeft: 2 }}>*</span>}
      {hint && <span style={{ fontWeight: 400, color: "var(--ink-4)", marginLeft: 4 }}>{hint}</span>}
    </label>
  )

  const availableTeachers = allTeachers.filter((t) => !delegateTeacherIds.includes(t.id))

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && (
        <div style={{ display: "flex", gap: 8, background: "color-mix(in srgb, var(--rose) 8%, white)", border: "1px solid color-mix(in srgb, var(--rose) 25%, white)", borderRadius: 8, padding: "10px 14px" }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--rose)" style={{ flexShrink: 0, marginTop: 1 }}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
          <span style={{ fontSize: 13, color: "var(--rose)" }}>{error}</span>
        </div>
      )}

      {/* บัญชีผู้ใช้ */}
      <div className="ks-card">
        <div className="ks-card-header"><span>บัญชีผู้ใช้งาน</span></div>
        <div className="ks-card-pad" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            {lbl("ชื่อผู้ใช้ (username)", true)}
            <input value={form.username} onChange={set("username")} className="ks-input" placeholder="ชื่อผู้ใช้" autoComplete="off" />
          </div>
          <div>
            {lbl("รหัสผ่าน", mode === "create", mode === "edit" ? "(เว้นว่างหากไม่เปลี่ยน)" : undefined)}
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                className="ks-input"
                style={{ paddingRight: 36 }}
                placeholder="รหัสผ่าน"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            {lbl("ยืนยันรหัสผ่าน", mode === "create")}
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                className="ks-input"
                style={{ paddingRight: 36 }}
                placeholder="ยืนยันรหัสผ่าน"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ข้อมูลครู */}
      <div className="ks-card">
        <div className="ks-card-header"><span>ข้อมูลครู</span></div>
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
        <div className="ks-card-header"><span>บทบาทและตำแหน่ง</span></div>
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

      {/* ผู้รับมอบอำนาจอนุมัติแทน — แสดงเฉพาะ DIRECTOR/VICE_DIRECTOR ใน edit mode */}
      {showDelegateSection && (
        <div className="ks-card">
          <div className="ks-card-header">
            <span>ผู้รับมอบอำนาจอนุมัติแทน</span>
          </div>
          <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)" }}>
              กำหนดครูที่สามารถกดอนุมัติบันทึกถ้อยคำแทนคุณได้ ครูเหล่านี้จะเห็นเมนู &quot;รออนุมัติ&quot; ในระบบ
            </p>

            {loadingDelegates ? (
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>กำลังโหลด...</div>
            ) : (
              <>
                {/* รายชื่อ delegate ปัจจุบัน */}
                <div>
                  {lbl("ผู้รับมอบอำนาจปัจจุบัน")}
                  {delegateTeacherIds.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--ink-4)", padding: "8px 0" }}>
                      ยังไม่ได้กำหนดผู้รับมอบอำนาจ
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {delegateTeacherIds.map((tid) => {
                        const t = allTeachers.find((x) => x.id === tid)
                        if (!t) return null
                        return (
                          <span
                            key={tid}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "4px 10px 4px 12px",
                              background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)",
                              borderRadius: 20, fontSize: 13, color: "var(--indigo-ink)",
                            }}
                          >
                            {t.name}
                            <button
                              type="button"
                              onClick={() => removeDelegate(tid)}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: 16, height: 16, borderRadius: "50%",
                                background: "var(--indigo)", border: "none", cursor: "pointer",
                                color: "#fff", padding: 0, flexShrink: 0,
                              }}
                            >
                              <X size={10} />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* เพิ่ม delegate */}
                {availableTeachers.length > 0 && (
                  <div style={{ maxWidth: 400 }}>
                    {lbl("เพิ่มผู้รับมอบอำนาจ")}
                    <select
                      className="ks-select"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) addDelegate(Number(e.target.value))
                        e.target.value = ""
                      }}
                    >
                      <option value="">— เลือกครูที่จะมอบอำนาจ —</option>
                      {availableTeachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ลายเซ็น */}
      <div className="ks-card">
        <div className="ks-card-header"><span>ลายเซ็น</span></div>
        <div className="ks-card-pad">
          <SignaturePad
            value={form.signatureUrl || null}
            onChange={(data) => setForm((prev) => ({ ...prev, signatureUrl: data ?? "" }))}
          />
        </div>
      </div>

      {/* ที่อยู่ */}
      <div className="ks-card">
        <div className="ks-card-header"><span>ที่อยู่</span></div>
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
              <input value={form.addressVillage} onChange={set("addressVillage")} className="ks-input" placeholder="หมู่บ้านสุขสันต์" />
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
          ) : mode === "create" ? "เพิ่มผู้ใช้" : "บันทึกการแก้ไข"}
        </button>
      </div>
    </form>
  )
}
