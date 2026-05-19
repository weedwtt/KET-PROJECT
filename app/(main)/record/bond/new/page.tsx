"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ChevronLeft, User, Check, ChevronRight } from "lucide-react"
import { toast } from "sonner"

// ── Types ──────────────────────────────────────────────────────────────────────

type Guardian = {
  id: number
  firstName: string
  lastName: string
  phone: string
  relation: { name: string }
}

type Advisor = {
  slot: number
  teacher: { title: { name: string }; firstName: string; lastName: string; id: number }
}

type Student = {
  id: number
  studentCode: string
  classNumber: number
  gradeLevel: string
  classRoom: number
  firstName: string
  lastName: string
  title: { name: string }
  guardians: Guardian[]
  advisors: Advisor[]
  addressHouseNo?: string
  addressMoo?: string | null
  addressVillage?: string | null
  addressRoad?: string | null
  addressSoi?: string | null
  addressSubDistrict?: string
  addressDistrict?: string
  addressProvince?: string
}

type TeacherOption = {
  id: number
  firstName: string
  lastName: string
  title: { name: string }
  signatureUrl: string | null
}

type BondFormData = {
  contractDate: string
  // Guardian
  guardianId: number | null
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  addressHouseNo: string
  addressMoo: string
  addressVillage: string
  addressRoad: string
  addressSoi: string
  addressSubDistrict: string
  addressDistrict: string
  addressProvince: string
  // Violation
  violationDetail: string
  // Measures
  measureDeductScore: boolean
  measureDeductPoints: string
  measureActivity: boolean
  measureSuspension: boolean
  measureTransfer: boolean
  // Recorder
  recorder: string
  // Teachers (dropdown)
  headTeacherId: number | null
  disciplineTeacherId: number | null
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BondNewPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Student[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [student, setStudent] = useState<Student | null>(null)

  const [form, setForm] = useState<BondFormData>({
    contractDate: new Date().toISOString().slice(0, 10),
    guardianId: null, guardianName: "", guardianRelation: "", guardianPhone: "",
    addressHouseNo: "", addressMoo: "", addressVillage: "", addressRoad: "",
    addressSoi: "", addressSubDistrict: "", addressDistrict: "", addressProvince: "",
    violationDetail: "",
    measureDeductScore: false, measureDeductPoints: "",
    measureActivity: false, measureSuspension: false, measureTransfer: false,
    recorder: "",
    headTeacherId: null, disciplineTeacherId: null,
  })

  // Signatures
  const [guardianSig, setGuardianSig] = useState("")
  const [studentSig, setStudentSig] = useState("")
  const [advisorSig, setAdvisorSig] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function upd(fields: Partial<BondFormData>) {
    setForm((p) => ({ ...p, ...fields }))
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSearchError(null)
    setResults(null)
    try {
      const res = await fetch(`/api/students/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error()
      const data: Student[] = await res.json()
      if (data.length === 0) {
        setSearchError("ไม่พบนักเรียน")
        setResults([])
      } else if (data.length === 1) {
        selectStudent(data[0])
      } else {
        setResults(data)
      }
    } catch {
      setSearchError("เกิดข้อผิดพลาดในการค้นหา")
    } finally {
      setSearching(false)
    }
  }

  function selectStudent(s: Student) {
    setStudent(s)
    setQuery("")
    setResults(null)
    // Auto-fill recorder from advisor1
    const advisor1 = s.advisors.find((a) => a.slot === 1)?.teacher
    if (advisor1) {
      upd({ recorder: `${advisor1.title.name}${advisor1.firstName} ${advisor1.lastName}` })
    }
  }

  function selectGuardian(g: Guardian) {
    if (!student) return
    upd({
      guardianId: g.id,
      guardianName: `${g.firstName} ${g.lastName}`,
      guardianRelation: g.relation.name,
      guardianPhone: g.phone ?? "",
      addressHouseNo: student.addressHouseNo ?? "",
      addressMoo: student.addressMoo ?? "",
      addressVillage: student.addressVillage ?? "",
      addressRoad: student.addressRoad ?? "",
      addressSoi: student.addressSoi ?? "",
      addressSubDistrict: student.addressSubDistrict ?? "",
      addressDistrict: student.addressDistrict ?? "",
      addressProvince: student.addressProvince ?? "",
    })
  }

  const isValid =
    !!student && !!form.contractDate && !!form.guardianName && !!form.violationDetail && !!form.recorder

  async function handleSubmit() {
    if (!student || !isValid) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/bonds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          contractDate: form.contractDate,
          guardianId: form.guardianId,
          guardianName: form.guardianName,
          guardianRelation: form.guardianRelation,
          guardianPhone: form.guardianPhone || null,
          addressHouseNo: form.addressHouseNo || null,
          addressMoo: form.addressMoo || null,
          addressVillage: form.addressVillage || null,
          addressRoad: form.addressRoad || null,
          addressSoi: form.addressSoi || null,
          addressSubDistrict: form.addressSubDistrict || null,
          addressDistrict: form.addressDistrict || null,
          addressProvince: form.addressProvince || null,
          violationDetail: form.violationDetail,
          measureDeductScore: form.measureDeductScore,
          measureDeductPoints: form.measureDeductScore && form.measureDeductPoints ? form.measureDeductPoints : null,
          measureActivity: form.measureActivity,
          measureSuspension: form.measureSuspension,
          measureTransfer: form.measureTransfer,
          recorder: form.recorder,
          headTeacherId: form.headTeacherId,
          disciplineTeacherId: form.disciplineTeacherId,
          guardianSignature: guardianSig || null,
          studentSignature: studentSig || null,
          advisorSignature: advisorSig || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setSaveError(err.error ?? "เกิดข้อผิดพลาด")
        toast.error(err.error ?? "เกิดข้อผิดพลาด")
        return
      }
      toast.success("บันทึกทัณฑ์บนสำเร็จ")
      router.push("/record/bond")
    } catch {
      setSaveError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setSaving(false)
    }
  }

  const advisor1 = student?.advisors.find((a) => a.slot === 1)?.teacher

  return (
    <div className="ks-page" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/record/bond" className="btn btn-ghost btn-sm btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="page-eyebrow">บันทึกทัณฑ์บน · สร้างใหม่</div>
            <h1>บันทึกสัญญาทัณฑ์บน</h1>
          </div>
        </div>
        <Link href="/record/bond" className="btn btn-ghost btn-sm">ยกเลิก</Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* § 01 — Student */}
        <Section marker="01" title="ค้นหาและเลือกนักเรียน">
          <div style={{ marginBottom: 16 }}>
            <FieldLabel>ค้นหานักเรียน</FieldLabel>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }} />
                <input
                  className="ks-input"
                  style={{ paddingLeft: 42 }}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setStudent(null) }}
                  placeholder="เช่น 30412 · ปวีณ์ธิดา · ม.4/2"
                  disabled={searching}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={!query.trim() || searching}>
                {searching ? <SpinIcon /> : <Search size={14} />} ค้นหา
              </button>
            </form>
            {searchError && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--rose-wash, #fff0f0)", border: "1px solid var(--rose)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--rose)" }}>
                {searchError}
              </div>
            )}
          </div>

          {results && results.length > 1 && !student && (
            <div style={{ border: "1px solid var(--rule)", borderRadius: "var(--radius)", marginBottom: 16, overflow: "hidden" }}>
              {results.map((s) => (
                <button key={s.id} onClick={() => selectStudent(s)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", borderBottom: "1px solid var(--rule-soft)", cursor: "pointer", textAlign: "left" }}>
                  <User size={15} style={{ color: "var(--indigo)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{s.title.name}{s.firstName} {s.lastName}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{s.studentCode} · {s.gradeLevel}/{s.classRoom}</div>
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--ink-4)" }} />
                </button>
              ))}
            </div>
          )}

          {student && (
            <div style={{ background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)", borderRadius: "var(--radius)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, background: "var(--indigo)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{student.title.name}{student.firstName} {student.lastName}</div>
                <div style={{ fontSize: 12.5, color: "var(--indigo-ink)", fontFamily: "var(--font-mono)" }}>
                  {student.studentCode} · ชั้น {student.gradeLevel}/{student.classRoom} · เลขที่ {student.classNumber}
                </div>
                {advisor1 && (
                  <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>
                    ครูที่ปรึกษา: {advisor1.title.name}{advisor1.firstName} {advisor1.lastName}
                  </div>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setStudent(null); setQuery("") }}>เปลี่ยน</button>
            </div>
          )}
        </Section>

        {/* § 02 — Contract info */}
        <Section marker="02" title="ข้อมูลสัญญาและผู้ปกครอง">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div>
              <FieldLabel required>วันที่ทำสัญญา</FieldLabel>
              <input
                className="ks-input"
                type="date"
                value={form.contractDate}
                onChange={(e) => upd({ contractDate: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel required>ผู้บันทึก</FieldLabel>
              <input
                className="ks-input"
                value={form.recorder}
                onChange={(e) => upd({ recorder: e.target.value })}
                placeholder="ชื่อผู้บันทึก"
              />
            </div>
          </div>

          {/* Guardian selection */}
          {student && student.guardians.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <FieldLabel>เลือกผู้ปกครอง</FieldLabel>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                {student.guardians.map((g) => {
                  const sel = form.guardianId === g.id
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => selectGuardian(g)}
                      className={sel ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                    >
                      {g.firstName} {g.lastName} ({g.relation.name})
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <FieldLabel required>ชื่อผู้ปกครอง</FieldLabel>
              <input className="ks-input" value={form.guardianName} onChange={(e) => upd({ guardianName: e.target.value })} placeholder="ชื่อ-นามสกุล" />
            </div>
            <div>
              <FieldLabel>ความสัมพันธ์</FieldLabel>
              <input className="ks-input" value={form.guardianRelation} onChange={(e) => upd({ guardianRelation: e.target.value })} placeholder="เช่น มารดา" />
            </div>
            <div>
              <FieldLabel>โทรศัพท์</FieldLabel>
              <input className="ks-input" value={form.guardianPhone} onChange={(e) => upd({ guardianPhone: e.target.value })} placeholder="08x-xxx-xxxx" />
            </div>
          </div>

          <div className="divider-label" style={{ marginTop: 8 }}>ที่อยู่ผู้ปกครอง</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <FieldLabel>บ้านเลขที่</FieldLabel>
              <input className="ks-input" value={form.addressHouseNo} onChange={(e) => upd({ addressHouseNo: e.target.value })} />
            </div>
            <div>
              <FieldLabel>หมู่</FieldLabel>
              <input className="ks-input" value={form.addressMoo} onChange={(e) => upd({ addressMoo: e.target.value })} />
            </div>
            <div>
              <FieldLabel>หมู่บ้าน</FieldLabel>
              <input className="ks-input" value={form.addressVillage} onChange={(e) => upd({ addressVillage: e.target.value })} />
            </div>
            <div>
              <FieldLabel>ซอย</FieldLabel>
              <input className="ks-input" value={form.addressSoi} onChange={(e) => upd({ addressSoi: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <FieldLabel>ถนน</FieldLabel>
              <input className="ks-input" value={form.addressRoad} onChange={(e) => upd({ addressRoad: e.target.value })} />
            </div>
            <div>
              <FieldLabel>ตำบล</FieldLabel>
              <input className="ks-input" value={form.addressSubDistrict} onChange={(e) => upd({ addressSubDistrict: e.target.value })} />
            </div>
            <div>
              <FieldLabel>อำเภอ</FieldLabel>
              <input className="ks-input" value={form.addressDistrict} onChange={(e) => upd({ addressDistrict: e.target.value })} />
            </div>
            <div>
              <FieldLabel>จังหวัด</FieldLabel>
              <input className="ks-input" value={form.addressProvince} onChange={(e) => upd({ addressProvince: e.target.value })} />
            </div>
          </div>
        </Section>

        {/* § 03 — Violation */}
        <Section marker="03" title="รายละเอียดความผิด">
          <div>
            <FieldLabel required>รายละเอียดการกระทำผิด</FieldLabel>
            <textarea
              className="ks-textarea"
              value={form.violationDetail}
              onChange={(e) => upd({ violationDetail: e.target.value })}
              placeholder="ระบุพฤติกรรมที่กระทำผิดและรายละเอียดที่เกี่ยวข้อง"
              rows={5}
              style={{ resize: "vertical" }}
            />
          </div>
        </Section>

        {/* § 04 — Measures */}
        <Section marker="04" title="มาตรการที่จะดำเนินการหากทำผิดซ้ำ">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MeasureCheck
              checked={form.measureDeductScore}
              onChange={(v) => upd({ measureDeductScore: v })}
              label="ตัดคะแนนความประพฤติ"
            >
              {form.measureDeductScore && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                  <input
                    className="ks-input"
                    type="number" min={1} max={100}
                    style={{ width: 80, height: 32 }}
                    value={form.measureDeductPoints}
                    onChange={(e) => upd({ measureDeductPoints: e.target.value })}
                    placeholder="0"
                  />
                  <span style={{ fontSize: 13, color: "var(--ink-2)" }}>คะแนน</span>
                </div>
              )}
            </MeasureCheck>
            <MeasureCheck
              checked={form.measureActivity}
              onChange={(v) => upd({ measureActivity: v })}
              label="ทำกิจกรรมค่ายปรับพฤติกรรม"
            />
            <MeasureCheck
              checked={form.measureSuspension}
              onChange={(v) => upd({ measureSuspension: v })}
              label="พักการเรียน"
            />
            <MeasureCheck
              checked={form.measureTransfer}
              onChange={(v) => upd({ measureTransfer: v })}
              label="ย้ายสถานศึกษา"
            />
          </div>
        </Section>

        {/* § 05 — Signatures */}
        <Section marker="05" title="ลายเซ็น">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
            <SigPad
              label="ผู้ปกครอง"
              name={form.guardianName || "ผู้ปกครอง"}
              value={guardianSig}
              onChange={setGuardianSig}
              onClear={() => setGuardianSig("")}
            />
            <SigPad
              label="นักเรียน"
              name={student ? `${student.title.name}${student.firstName} ${student.lastName}` : "นักเรียน"}
              value={studentSig}
              onChange={setStudentSig}
              onClear={() => setStudentSig("")}
            />
            <SigPad
              label="ครูที่ปรึกษา"
              name={advisor1 ? `${advisor1.title.name}${advisor1.firstName} ${advisor1.lastName}` : "ครูที่ปรึกษา"}
              value={advisorSig}
              onChange={setAdvisorSig}
              onClear={() => setAdvisorSig("")}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <TeacherSigSelect
              label="หัวหน้าระดับ"
              role="หัวหน้าระดับชั้น"
              selectedId={form.headTeacherId}
              onSelect={(id) => upd({ headTeacherId: id })}
            />
            <TeacherSigSelect
              label="ครูฝ่ายปกครอง"
              role="ครูฝ่ายปกครอง"
              selectedId={form.disciplineTeacherId}
              onSelect={(id) => upd({ disciplineTeacherId: id })}
            />
          </div>

        </Section>

        {/* Submit */}
        {saveError && (
          <div style={{ padding: "10px 14px", background: "var(--rose-wash, #fff0f0)", border: "1px solid var(--rose)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--rose)" }}>
            {saveError}
          </div>
        )}

        <div className="wizard-actions" style={{ background: "var(--surface)", border: "1px solid var(--rule)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}>
          <Link href="/record/bond" className="btn btn-secondary">
            <ChevronLeft size={14} /> ยกเลิก
          </Link>
          <div className="right">
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!isValid || saving}
              style={{ opacity: isValid ? 1 : 0.5, background: "var(--sage, #059669)" }}
            >
              {saving ? <><SpinIcon /> กำลังบันทึก...</> : <><Check size={14} /> บันทึกสัญญาทัณฑ์บน</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ marker, title, children }: { marker: string; title: string; children: React.ReactNode }) {
  return (
    <div className="ks-card">
      <div style={{ padding: "18px 24px 0" }}>
        <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.12em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 4 }}>§ {marker}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 20 }}>{title}</div>
      </div>
      <div style={{ padding: "0 24px 24px" }}>{children}</div>
    </div>
  )
}

// ── MeasureCheck ───────────────────────────────────────────────────────────────

function MeasureCheck({ checked, onChange, label, children }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; children?: React.ReactNode
}) {
  return (
    <div style={{
      padding: "14px 18px",
      border: `1px solid ${checked ? "var(--indigo)" : "var(--rule)"}`,
      borderRadius: "var(--radius)",
      background: checked ? "var(--indigo-wash)" : "var(--surface)",
    }}>
      <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div style={{
          width: 20, height: 20, borderRadius: 4, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: checked ? "var(--indigo)" : "transparent",
          border: `2px solid ${checked ? "var(--indigo)" : "var(--rule-2)"}`,
        }}>
          {checked && <Check size={12} color="#fff" />}
        </div>
        <input type="checkbox" style={{ display: "none" }} checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{label}</span>
      </label>
      {children && <div style={{ marginLeft: 32 }}>{children}</div>}
    </div>
  )
}

// ── SigPad ─────────────────────────────────────────────────────────────────────

function SigPad({ label, name, value, onChange, onClear }: {
  label: string; name: string; value: string
  onChange: (url: string) => void; onClear: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  function getXY(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height
    if ("touches" in e) return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }
  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault(); drawing.current = true
    const ctx = canvasRef.current!.getContext("2d")!
    const { x, y } = getXY(e); ctx.beginPath(); ctx.moveTo(x, y)
  }
  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault(); if (!drawing.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "var(--ink)"
    const { x, y } = getXY(e); ctx.lineTo(x, y); ctx.stroke()
  }
  function stopDraw() { drawing.current = false }
  function clear() { canvasRef.current?.getContext("2d")?.clearRect(0, 0, 600, 160); onClear() }

  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <span style={{ color: value ? "var(--sage)" : "var(--ink-4)" }}>{value ? "● ลงนามแล้ว" : "○ ยังไม่ลงนาม"}</span>
      </div>
      <div className="sig-pad" style={{ height: 130, border: value ? "1px solid var(--sage)" : undefined, background: value ? "var(--sage-wash, #f0fdf4)" : undefined, cursor: "crosshair" }}>
        {value ? (
          <img src={value} alt="sig" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
        ) : (
          <canvas ref={canvasRef} width={600} height={160}
            style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
          />
        )}
        <span className="sig-label">{label}</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>ล้าง</button>
        {!value && (
          <button type="button" className="btn btn-primary btn-sm"
            onClick={() => onChange(canvasRef.current!.toDataURL("image/png"))}>
            ยืนยันลายเซ็น
          </button>
        )}
        {value && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--sage)" }}><Check size={12} /> บันทึกแล้ว</span>}
      </div>
      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 500 }}>{name}</div>
    </div>
  )
}

// ── TeacherSigSelect ───────────────────────────────────────────────────────────

function TeacherSigSelect({ label, role, selectedId, onSelect }: {
  label: string; role: string; selectedId: number | null; onSelect: (id: number | null) => void
}) {
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/teachers/by-role?role=${encodeURIComponent(role)}`)
      .then((r) => r.json())
      .then((data) => { setTeachers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role])

  const selected = teachers.find((t) => t.id === selectedId)

  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        {selected && <span style={{ color: "var(--sage)" }}>● เลือกแล้ว</span>}
      </div>
      {loading ? (
        <div style={{ height: 38, background: "var(--paper-2)", borderRadius: "var(--radius)", animation: "pulse 1.5s infinite" }} />
      ) : (
        <select className="ks-select" value={selectedId ?? ""} onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}>
          <option value="">เลือก{label}</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.title.name}{t.firstName} {t.lastName}</option>
          ))}
        </select>
      )}
      {selected && (
        <div className="sig-display" style={{ marginTop: 10, borderColor: selected.signatureUrl ? "var(--sage)" : undefined }}>
          {selected.signatureUrl
            ? <img src={selected.signatureUrl} alt="sig" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ยังไม่มีลายเซ็นในระบบ</span>}
          <span className="sig-name">{selected.title.name}{selected.firstName} {selected.lastName}</span>
        </div>
      )}
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--ink-2)", marginBottom: 6 }}>
      {children}{required && <span style={{ color: "var(--rose)", marginLeft: 2 }}>*</span>}
    </label>
  )
}

function SpinIcon() {
  return (
    <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/>
      <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}
