"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, User, Check } from "lucide-react"
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
  gradeHeadLevel: string | null
}

const GRADE_HEAD_LEVEL_LABEL: Record<string, string> = {
  M1: "ม.1", M2: "ม.2", M3: "ม.3", M4: "ม.4", M5: "ม.5", M6: "ม.6",
}

type SemesterItem = { id: number; name: string; value: number }
type AcademicYearItem = { id: number; year: number }

type BondFormData = {
  contractDate: string
  semesterId: string
  academicYearId: string
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
  violationDetail: string
  measureDeductScore: boolean
  measureDeductPoints: string
  measureActivity: boolean
  measureSuspension: boolean
  measureTransfer: boolean
  advisor1Name: string
  advisor2Name: string
  recorder: string
  headTeacherId: number | null
  disciplineTeacherId: number | null
}

// ── Steps config ───────────────────────────────────────────────────────────────

const STEPS = [
  { num: "01", label: "นักเรียน",            en: "STUDENT"   },
  { num: "02", label: "ผู้ปกครองและที่อยู่", en: "GUARDIAN"  },
  { num: "03", label: "รายละเอียดความผิด",   en: "VIOLATION" },
  { num: "04", label: "มาตรการ",             en: "MEASURES"  },
  { num: "05", label: "ลายเซ็นและยืนยัน",   en: "SIGNATURES"},
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BondNewPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Student[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [semesters, setSemesters] = useState<SemesterItem[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([])
  const [loadingSem, setLoadingSem] = useState(false)

  const [form, setForm] = useState<BondFormData>({
    contractDate: new Date().toISOString().slice(0, 10),
    semesterId: "", academicYearId: "",
    guardianId: null, guardianName: "", guardianRelation: "", guardianPhone: "",
    addressHouseNo: "", addressMoo: "", addressVillage: "", addressRoad: "",
    addressSoi: "", addressSubDistrict: "", addressDistrict: "", addressProvince: "",
    violationDetail: "",
    measureDeductScore: false, measureDeductPoints: "",
    measureActivity: false, measureSuspension: false, measureTransfer: false,
    advisor1Name: "", advisor2Name: "",
    recorder: "",
    headTeacherId: null, disciplineTeacherId: null,
  })

  const [guardianSig, setGuardianSig] = useState("")
  const [studentSig, setStudentSig] = useState("")
  const [advisorSig, setAdvisorSig] = useState("")
  const [headTeacherSig, setHeadTeacherSig] = useState("")
  const [disciplineTeacherSig, setDisciplineTeacherSig] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    setLoadingSem(true)
    Promise.all([
      fetch("/api/master/semesters").then((r) => r.json()),
      fetch("/api/master/academic-years").then((r) => r.json()),
    ]).then(([sem, ay]) => {
      setSemesters(sem)
      setAcademicYears(ay)
      setLoadingSem(false)
    }).catch(() => setLoadingSem(false))
  }, [])

  function upd(fields: Partial<BondFormData>) {
    setForm((p) => ({ ...p, ...fields }))
  }

  function goStep(n: number) {
    setStep(n)
    window.scrollTo({ top: 0, behavior: "smooth" })
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
    const a1 = s.advisors.find((a) => a.slot === 1)?.teacher
    const a2 = s.advisors.find((a) => a.slot === 2)?.teacher
    upd({
      advisor1Name: a1 ? `${a1.title.name}${a1.firstName} ${a1.lastName}` : "",
      advisor2Name: a2 ? `${a2.title.name}${a2.firstName} ${a2.lastName}` : "",
    })
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

  async function handleSubmit() {
    if (!student) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/bonds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          contractDate: form.contractDate,
          semesterId: form.semesterId || null,
          academicYearId: form.academicYearId || null,
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
          advisor1Name: form.advisor1Name || null,
          advisor2Name: form.advisor2Name || null,
          recorder: form.recorder,
          headTeacherId: form.headTeacherId,
          headTeacherSignature: headTeacherSig || null,
          disciplineTeacherId: form.disciplineTeacherId,
          disciplineTeacherSignature: disciplineTeacherSig || null,
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
  const advisor2 = student?.advisors.find((a) => a.slot === 2)?.teacher
  const advisorNames = [advisor1, advisor2].filter(Boolean).map((t) => `${t!.title.name}${t!.firstName} ${t!.lastName}`).join(" | ") || "ครูที่ปรึกษา"

  const step0Valid = !!student && !!form.contractDate && !!form.semesterId && !!form.academicYearId
  const step1Valid = !!form.guardianName
  const step2Valid = !!form.violationDetail

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

      <WizardStepper currentStep={step} />

      {step === 0 && (
        <StepStudent
          query={query} setQuery={setQuery}
          searching={searching} results={results} searchError={searchError}
          onSearch={handleSearch} onSelectResult={selectStudent}
          student={student} onClearStudent={() => setStudent(null)}
          semesters={semesters} academicYears={academicYears} loadingSem={loadingSem}
          form={form} upd={upd}
          isValid={step0Valid}
          onNext={() => goStep(1)}
        />
      )}

      {step === 1 && student && (
        <StepGuardian
          student={student}
          form={form} upd={upd}
          onSelectGuardian={selectGuardian}
          isValid={step1Valid}
          onBack={() => goStep(0)} onNext={() => goStep(2)}
        />
      )}

      {step === 2 && student && (
        <StepViolation
          student={student}
          violationDetail={form.violationDetail}
          onChange={(v) => upd({ violationDetail: v })}
          isValid={step2Valid}
          onBack={() => goStep(1)} onNext={() => goStep(3)}
        />
      )}

      {step === 3 && student && (
        <StepMeasures
          student={student}
          form={form} upd={upd}
          onBack={() => goStep(2)} onNext={() => goStep(4)}
        />
      )}

      {step === 4 && student && (
        <StepSignatures
          student={student} advisorNames={advisorNames}
          form={form} upd={upd}
          guardianSig={guardianSig} setGuardianSig={setGuardianSig}
          studentSig={studentSig} setStudentSig={setStudentSig}
          advisorSig={advisorSig} setAdvisorSig={setAdvisorSig}
          headTeacherSig={headTeacherSig} setHeadTeacherSig={setHeadTeacherSig}
          disciplineTeacherSig={disciplineTeacherSig} setDisciplineTeacherSig={setDisciplineTeacherSig}
          saving={saving} saveError={saveError}
          onBack={() => goStep(3)} onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// ── Stepper ────────────────────────────────────────────────────────────────────

function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="wizard-stepper">
      <div className="wizard-frame">
        {STEPS.map((s, i) => {
          const state = i < currentStep ? "complete" : i === currentStep ? "current" : ""
          return (
            <div key={s.num} className={`wizard-step ${state}`}>
              <div className="step-tick" />
              <div className="step-meta">
                <span className="step-num">
                  {i < currentStep ? <Check size={12} /> : s.num}
                </span>
                <span style={{ fontSize: 10, letterSpacing: "0.07em", color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{s.en}</span>
              </div>
              <span className="step-label">{s.label}</span>
            </div>
          )
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--rule-soft)", fontSize: 12, color: "var(--ink-3)" }}>
        <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
          ขั้นตอน {currentStep + 1} จาก {STEPS.length}
        </span>
        <span style={{ display: "flex", gap: 14 }}>
          <span><span style={{ display: "inline-block", width: 8, height: 8, background: "var(--sage)", borderRadius: 2, marginRight: 5 }} />เสร็จแล้ว</span>
          <span><span style={{ display: "inline-block", width: 8, height: 8, background: "var(--indigo)", borderRadius: 2, marginRight: 5 }} />ปัจจุบัน</span>
          <span><span style={{ display: "inline-block", width: 8, height: 8, background: "var(--rule-2)", borderRadius: 2, marginRight: 5 }} />ยังไม่ถึง</span>
        </span>
      </div>
    </div>
  )
}

// ── Student summary badge (reused in steps 1–4) ────────────────────────────────

function StudentBadge({ student }: { student: Student }) {
  const advisor1 = student.advisors.find((a) => a.slot === 1)?.teacher
  const advisor2 = student.advisors.find((a) => a.slot === 2)?.teacher
  const advisorDisplay = [advisor1, advisor2].filter(Boolean).map((t) => `${t!.title.name}${t!.firstName} ${t!.lastName}`).join(" | ")
  return (
    <div style={{ background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)", borderRadius: "var(--radius)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <div style={{ width: 38, height: 38, background: "var(--indigo)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <User size={18} color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{student.title.name}{student.firstName} {student.lastName}</div>
        <div style={{ fontSize: 12, color: "var(--indigo-ink)", fontFamily: "var(--font-mono)" }}>
          {student.studentCode} · ชั้น {student.gradeLevel}/{student.classRoom}
          {advisorDisplay && <> · ครูที่ปรึกษา: {advisorDisplay}</>}
        </div>
      </div>
    </div>
  )
}

// ── Step 0: Student ────────────────────────────────────────────────────────────

function StepStudent({
  query, setQuery, searching, results, searchError, onSearch, onSelectResult,
  student, onClearStudent,
  semesters, academicYears, loadingSem,
  form, upd,
  isValid, onNext,
}: {
  query: string; setQuery: (v: string) => void
  searching: boolean; results: Student[] | null; searchError: string | null
  onSearch: (e: React.FormEvent) => void; onSelectResult: (s: Student) => void
  student: Student | null; onClearStudent: () => void
  semesters: SemesterItem[]; academicYears: AcademicYearItem[]; loadingSem: boolean
  form: BondFormData; upd: (f: Partial<BondFormData>) => void
  isValid: boolean; onNext: () => void
}) {
  return (
    <div className="wizard-body">
      <h2 className="step-heading">ค้นหาและเลือกนักเรียน</h2>
      <p className="step-sub">พิมพ์รหัสนักเรียน ชื่อ-สกุล หรือชั้นเรียน เพื่อค้นหา</p>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <FieldLabel>ค้นหา</FieldLabel>
        <form onSubmit={onSearch} style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }} />
            <input
              className="ks-input"
              style={{ paddingLeft: 42 }}
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (!e.target.value) onClearStudent() }}
              placeholder="เช่น 30412 · ปวีณ์ธิดา · ม.4/2"
              disabled={searching}
              autoFocus={!student}
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
        <div style={{ border: "1px solid var(--rule)", borderRadius: "var(--radius)", marginBottom: 20, overflow: "hidden", background: "var(--surface-2)" }}>
          {results.map((s) => (
            <button key={s.id} onClick={() => onSelectResult(s)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", borderBottom: "1px solid var(--rule-soft)", cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 36, height: 36, background: "var(--indigo-wash)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={15} style={{ color: "var(--indigo)" }} />
              </div>
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
        <div className="ks-card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", padding: 20, gap: 16, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, background: "var(--indigo)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  STUDENT · {student.studentCode}
                </span>
                <span className="chip chip-approved" style={{ height: 20, fontSize: 11 }}>ตรงกัน</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.005em" }}>{student.title.name}{student.firstName} {student.lastName}</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}>ชั้น {student.gradeLevel}/{student.classRoom} · เลขที่ {student.classNumber}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClearStudent}>เปลี่ยน</button>
          </div>
        </div>
      )}

      {/* Contract date + semester + year */}
      <div style={{ borderTop: "1px solid var(--rule-soft)", paddingTop: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>
          วันที่และภาคเรียน
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div>
            <FieldLabel required>วันที่ทำสัญญา</FieldLabel>
            <input className="ks-input" type="date" value={form.contractDate} onChange={(e) => upd({ contractDate: e.target.value })} />
          </div>
          <div>
            <FieldLabel required>ภาคเรียน</FieldLabel>
            {loadingSem ? (
              <div style={{ height: 38, background: "var(--paper-2)", borderRadius: "var(--radius)", animation: "pulse 1.5s infinite" }} />
            ) : (
              <select className="ks-select" value={form.semesterId} onChange={(e) => upd({ semesterId: e.target.value })}>
                <option value="" disabled>เลือกภาคเรียน</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <FieldLabel required>ปีการศึกษา</FieldLabel>
            {loadingSem ? (
              <div style={{ height: 38, background: "var(--paper-2)", borderRadius: "var(--radius)", animation: "pulse 1.5s infinite" }} />
            ) : (
              <select className="ks-select" value={form.academicYearId} onChange={(e) => upd({ academicYearId: e.target.value })}>
                <option value="" disabled>เลือกปีการศึกษา</option>
                {academicYears.map((a) => <option key={a.id} value={a.id}>{a.year}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="wizard-actions">
        <div />
        <button className="btn btn-primary" onClick={onNext} disabled={!isValid} style={{ opacity: isValid ? 1 : 0.5 }}>
          ถัดไป — ผู้ปกครอง <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Step 1: Guardian ───────────────────────────────────────────────────────────

function StepGuardian({
  student, form, upd, onSelectGuardian, isValid, onBack, onNext,
}: {
  student: Student; form: BondFormData; upd: (f: Partial<BondFormData>) => void
  onSelectGuardian: (g: Guardian) => void
  isValid: boolean; onBack: () => void; onNext: () => void
}) {
  return (
    <div className="wizard-body">
      <StudentBadge student={student} />
      <h2 className="step-heading">ข้อมูลผู้ปกครองและที่อยู่</h2>
      <p className="step-sub">กรอกข้อมูลผู้ปกครองที่เข้าทำสัญญา หากมีข้อมูลในระบบสามารถเลือกได้เลย</p>

      {student.guardians.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <FieldLabel>เลือกผู้ปกครองจากระบบ</FieldLabel>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {student.guardians.map((g) => {
              const sel = form.guardianId === g.id
              return (
                <button key={g.id} type="button" onClick={() => onSelectGuardian(g)}
                  className={sel ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div><FieldLabel>บ้านเลขที่</FieldLabel><input className="ks-input" value={form.addressHouseNo} onChange={(e) => upd({ addressHouseNo: e.target.value })} /></div>
        <div><FieldLabel>หมู่</FieldLabel><input className="ks-input" value={form.addressMoo} onChange={(e) => upd({ addressMoo: e.target.value })} /></div>
        <div><FieldLabel>หมู่บ้าน</FieldLabel><input className="ks-input" value={form.addressVillage} onChange={(e) => upd({ addressVillage: e.target.value })} /></div>
        <div><FieldLabel>ซอย</FieldLabel><input className="ks-input" value={form.addressSoi} onChange={(e) => upd({ addressSoi: e.target.value })} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div><FieldLabel>ถนน</FieldLabel><input className="ks-input" value={form.addressRoad} onChange={(e) => upd({ addressRoad: e.target.value })} /></div>
        <div><FieldLabel>ตำบล</FieldLabel><input className="ks-input" value={form.addressSubDistrict} onChange={(e) => upd({ addressSubDistrict: e.target.value })} /></div>
        <div><FieldLabel>อำเภอ</FieldLabel><input className="ks-input" value={form.addressDistrict} onChange={(e) => upd({ addressDistrict: e.target.value })} /></div>
        <div><FieldLabel>จังหวัด</FieldLabel><input className="ks-input" value={form.addressProvince} onChange={(e) => upd({ addressProvince: e.target.value })} /></div>
      </div>

      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={onBack}><ChevronLeft size={14} /> ย้อนกลับ</button>
        <button className="btn btn-primary" onClick={onNext} disabled={!isValid} style={{ opacity: isValid ? 1 : 0.5 }}>
          ถัดไป — รายละเอียดความผิด <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Violation ──────────────────────────────────────────────────────────

function StepViolation({
  student, violationDetail, onChange, isValid, onBack, onNext,
}: {
  student: Student; violationDetail: string; onChange: (v: string) => void
  isValid: boolean; onBack: () => void; onNext: () => void
}) {
  return (
    <div className="wizard-body">
      <StudentBadge student={student} />
      <h2 className="step-heading">รายละเอียดการกระทำผิด</h2>
      <p className="step-sub">ระบุพฤติกรรมที่กระทำผิดและรายละเอียดที่เกี่ยวข้องอย่างครบถ้วน</p>

      <div style={{ marginBottom: 20 }}>
        <FieldLabel required>รายละเอียดการกระทำผิด</FieldLabel>
        <textarea
          className="ks-textarea"
          value={violationDetail}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ระบุพฤติกรรมที่กระทำผิดและรายละเอียดที่เกี่ยวข้อง"
          rows={6}
          style={{ resize: "vertical" }}
          autoFocus
        />
      </div>

      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={onBack}><ChevronLeft size={14} /> ย้อนกลับ</button>
        <button className="btn btn-primary" onClick={onNext} disabled={!isValid} style={{ opacity: isValid ? 1 : 0.5 }}>
          ถัดไป — มาตรการ <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Measures ───────────────────────────────────────────────────────────

function StepMeasures({
  student, form, upd, onBack, onNext,
}: {
  student: Student; form: BondFormData; upd: (f: Partial<BondFormData>) => void
  onBack: () => void; onNext: () => void
}) {
  const [recorders, setRecorders] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    fetch("/api/master/recorders")
      .then((r) => r.json())
      .then(setRecorders)
      .catch(() => {})
  }, [])

  return (
    <div className="wizard-body">
      <StudentBadge student={student} />
      <h2 className="step-heading">มาตรการที่จะดำเนินการหากทำผิดซ้ำ</h2>
      <p className="step-sub">เลือกมาตรการที่จะใช้หากนักเรียนกระทำผิดซ้ำในอนาคต</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        <MeasureCheck checked={form.measureDeductScore} onChange={(v) => upd({ measureDeductScore: v })} label="ตัดคะแนนความประพฤติ">
          {form.measureDeductScore && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
              <input className="ks-input" type="number" min={1} max={100} style={{ width: 80, height: 32 }}
                value={form.measureDeductPoints} onChange={(e) => upd({ measureDeductPoints: e.target.value })} placeholder="0" />
              <span style={{ fontSize: 13, color: "var(--ink-2)" }}>คะแนน</span>
            </div>
          )}
        </MeasureCheck>
        <MeasureCheck checked={form.measureActivity} onChange={(v) => upd({ measureActivity: v })} label="ทำกิจกรรมค่ายปรับพฤติกรรม" />
        <MeasureCheck checked={form.measureSuspension} onChange={(v) => upd({ measureSuspension: v })} label="พักการเรียน" />
        <MeasureCheck checked={form.measureTransfer} onChange={(v) => upd({ measureTransfer: v })} label="ย้ายสถานศึกษา" />
      </div>

      <div style={{ borderTop: "1px solid var(--rule-soft)", paddingTop: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>
          ครูที่ปรึกษาและผู้บันทึก
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div>
            <FieldLabel>ครูที่ปรึกษาคนที่ 1</FieldLabel>
            <input className="ks-input" value={form.advisor1Name} onChange={(e) => upd({ advisor1Name: e.target.value })} placeholder="ชื่อ-นามสกุล" />
          </div>
          <div>
            <FieldLabel>ครูที่ปรึกษาคนที่ 2</FieldLabel>
            <input className="ks-input" value={form.advisor2Name} onChange={(e) => upd({ advisor2Name: e.target.value })} placeholder="ชื่อ-นามสกุล" />
          </div>
          <div>
            <FieldLabel>ผู้บันทึก</FieldLabel>
            <select
              className="ks-select"
              value={form.recorder}
              onChange={(e) => upd({ recorder: e.target.value })}
            >
              <option value="">— เลือกผู้บันทึก —</option>
              {recorders.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={onBack}><ChevronLeft size={14} /> ย้อนกลับ</button>
        <button className="btn btn-primary" onClick={onNext}>
          ถัดไป — ลายเซ็น <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Signatures ─────────────────────────────────────────────────────────

function StepSignatures({
  student, advisorNames, form, upd,
  guardianSig, setGuardianSig,
  studentSig, setStudentSig,
  advisorSig, setAdvisorSig,
  headTeacherSig, setHeadTeacherSig,
  disciplineTeacherSig, setDisciplineTeacherSig,
  saving, saveError,
  onBack, onSubmit,
}: {
  student: Student
  advisorNames: string
  form: BondFormData; upd: (f: Partial<BondFormData>) => void
  guardianSig: string; setGuardianSig: (v: string) => void
  studentSig: string; setStudentSig: (v: string) => void
  advisorSig: string; setAdvisorSig: (v: string) => void
  headTeacherSig: string; setHeadTeacherSig: (v: string) => void
  disciplineTeacherSig: string; setDisciplineTeacherSig: (v: string) => void
  saving: boolean; saveError: string | null
  onBack: () => void; onSubmit: () => void
}) {
  return (
    <div className="wizard-body">
      <StudentBadge student={student} />
      <h2 className="step-heading">ลายเซ็นและยืนยัน</h2>
      <p className="step-sub">ลงนามในส่วนที่เกี่ยวข้อง แล้วกดบันทึกสัญญาทัณฑ์บน</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
        <SigPad label="ลายเซ็นนักเรียน" name={`${student.title.name}${student.firstName} ${student.lastName}`} value={studentSig} onChange={setStudentSig} onClear={() => setStudentSig("")} />
        <SigPad label="ลายเซ็นผู้ปกครอง" value={guardianSig} onChange={setGuardianSig} onClear={() => setGuardianSig("")} />
        <SigPad
          label="ลายเซ็นครูที่ปรึกษา"
          name={advisorNames}
          value={advisorSig} onChange={setAdvisorSig} onClear={() => setAdvisorSig("")}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <DisciplineTeacherSigSection
          selectedId={form.disciplineTeacherId}
          onSelect={(id) => { upd({ disciplineTeacherId: id }); setDisciplineTeacherSig("") }}
          liveSignature={disciplineTeacherSig}
          onLiveSign={(url) => { setDisciplineTeacherSig(url); upd({ disciplineTeacherId: null }) }}
          onLiveClear={() => setDisciplineTeacherSig("")}
        />
        <GradeHeadSigSection
          selectedId={form.headTeacherId}
          onSelect={(id) => { upd({ headTeacherId: id }); setHeadTeacherSig("") }}
          liveSignature={headTeacherSig}
          onLiveSign={(url) => { setHeadTeacherSig(url); upd({ headTeacherId: null }) }}
          onLiveClear={() => setHeadTeacherSig("")}
        />
      </div>

      {saveError && (
        <div style={{ padding: "10px 14px", background: "var(--rose-wash, #fff0f0)", border: "1px solid var(--rose)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--rose)", marginBottom: 16 }}>
          {saveError}
        </div>
      )}

      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={onBack} disabled={saving}><ChevronLeft size={14} /> ย้อนกลับ</button>
        <button className="btn btn-primary" onClick={onSubmit} disabled={saving}
          style={{ background: "var(--sage, #059669)" }}>
          {saving ? <><SpinIcon /> กำลังบันทึก...</> : <><Check size={14} /> บันทึกสัญญาทัณฑ์บน</>}
        </button>
      </div>
    </div>
  )
}

// ── MeasureCheck ───────────────────────────────────────────────────────────────

function MeasureCheck({ checked, onChange, label, children }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; children?: React.ReactNode
}) {
  return (
    <div style={{ padding: "14px 18px", border: `1px solid ${checked ? "var(--indigo)" : "var(--rule)"}`, borderRadius: "var(--radius)", background: checked ? "var(--indigo-wash)" : "var(--surface)" }}>
      <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: checked ? "var(--indigo)" : "transparent", border: `2px solid ${checked ? "var(--indigo)" : "var(--rule-2)"}` }}>
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
  label: string; name?: string; value: string
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
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onChange(canvasRef.current!.toDataURL("image/png"))}>
            ยืนยันลายเซ็น
          </button>
        )}
        {value && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--sage)" }}><Check size={12} /> บันทึกแล้ว</span>}
      </div>
      {name && <div style={{ marginTop: 6, fontSize: 13, fontWeight: 500 }}>{name}</div>}
    </div>
  )
}

// ── DisciplineTeacherSigSection ───────────────────────────────────────────────

function DisciplineTeacherSigSection({
  selectedId, onSelect, liveSignature, onLiveSign, onLiveClear,
}: {
  selectedId: number | null
  onSelect: (id: number | null) => void
  liveSignature: string
  onLiveSign: (url: string) => void
  onLiveClear: () => void
}) {
  const [mode, setMode] = useState<"system" | "live">(liveSignature ? "live" : "system")

  function switchToSystem() { setMode("system"); onLiveClear() }
  function switchToLive() { setMode("live"); onSelect(null) }

  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>ลายเซ็นครูฝ่ายปกครอง</span>
        {(selectedId || liveSignature) && <span style={{ color: "var(--sage)" }}>● เลือกแล้ว</span>}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "var(--surface-2)", borderRadius: "var(--radius)", padding: 3, width: "fit-content" }}>
        {(["system", "live"] as const).map((m) => (
          <button key={m} type="button" onClick={m === "system" ? switchToSystem : switchToLive}
            style={{ padding: "4px 12px", fontSize: 12, borderRadius: "calc(var(--radius) - 2px)", border: "none", cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
              background: mode === m ? "var(--surface)" : "transparent",
              color: mode === m ? "var(--ink)" : "var(--ink-3)",
              boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
            }}>
            {m === "system" ? "ดึงจากระบบ" : "เซ็นสด"}
          </button>
        ))}
      </div>
      {mode === "system"
        ? <TeacherSigSelectInner role="DISCIPLINE" selectedId={selectedId} onSelect={onSelect} hideSignature />
        : <SigPad label="ลายเซ็นครูฝ่ายปกครอง" value={liveSignature} onChange={onLiveSign} onClear={onLiveClear} />
      }
    </div>
  )
}

// ── GradeHeadSigSection ────────────────────────────────────────────────────────

function GradeHeadSigSection({
  selectedId, onSelect, liveSignature, onLiveSign, onLiveClear,
}: {
  selectedId: number | null
  onSelect: (id: number | null) => void
  liveSignature: string
  onLiveSign: (url: string) => void
  onLiveClear: () => void
}) {
  const [mode, setMode] = useState<"system" | "live">(liveSignature ? "live" : "system")

  function switchToSystem() { setMode("system"); onLiveClear() }
  function switchToLive() { setMode("live"); onSelect(null) }

  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>ลายเซ็นหัวหน้าระดับ</span>
        {(selectedId || liveSignature) && <span style={{ color: "var(--sage)" }}>● เลือกแล้ว</span>}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "var(--surface-2)", borderRadius: "var(--radius)", padding: 3, width: "fit-content" }}>
        {(["system", "live"] as const).map((m) => (
          <button key={m} type="button" onClick={m === "system" ? switchToSystem : switchToLive}
            style={{ padding: "4px 12px", fontSize: 12, borderRadius: "calc(var(--radius) - 2px)", border: "none", cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
              background: mode === m ? "var(--surface)" : "transparent",
              color: mode === m ? "var(--ink)" : "var(--ink-3)",
              boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
            }}>
            {m === "system" ? "ดึงจากระบบ" : "เซ็นสด"}
          </button>
        ))}
      </div>
      {mode === "system"
        ? <TeacherSigSelectInner role="หัวหน้าระดับชั้น" selectedId={selectedId} onSelect={onSelect} hideSignature />
        : <SigPad label="ลายเซ็นหัวหน้าระดับชั้น" value={liveSignature} onChange={onLiveSign} onClear={onLiveClear} />
      }
    </div>
  )
}

// ── TeacherSigSelect ───────────────────────────────────────────────────────────

function TeacherSigSelectInner({ role, label, selectedId, onSelect, hideSignature }: {
  role: string; label?: string; selectedId: number | null; onSelect: (id: number | null) => void; hideSignature?: boolean
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
    <>
      {loading ? (
        <div style={{ height: 38, background: "var(--paper-2)", borderRadius: "var(--radius)", animation: "pulse 1.5s infinite" }} />
      ) : (
        <select className="ks-select" value={selectedId ?? ""} onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}>
          <option value="">เลือก{label ?? role}</option>
          {teachers.map((t) => {
            const gradeLabel = t.gradeHeadLevel ? ` (${GRADE_HEAD_LEVEL_LABEL[t.gradeHeadLevel] ?? t.gradeHeadLevel})` : ""
            return (
              <option key={t.id} value={t.id}>{t.title.name}{t.firstName} {t.lastName}{gradeLabel}</option>
            )
          })}
        </select>
      )}
      {hideSignature && selected && (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)", borderRadius: "var(--radius)", fontSize: 13 }}>
          <div style={{ fontWeight: 500 }}>{selected.title.name}{selected.firstName} {selected.lastName}</div>
          <div style={{ fontSize: 12, color: "var(--indigo-ink)", marginTop: 2 }}>จะได้รับแบบฟอร์มเพื่ออนุมัติและลงลายเซ็น</div>
        </div>
      )}
      {!hideSignature && selected && (
        <div className="sig-display" style={{ marginTop: 10, borderColor: selected.signatureUrl ? "var(--sage)" : undefined }}>
          {selected.signatureUrl
            ? <img src={selected.signatureUrl} alt="sig" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ยังไม่มีลายเซ็นในระบบ</span>}
          <span className="sig-name">{selected.title.name}{selected.firstName} {selected.lastName}</span>
        </div>
      )}
    </>
  )
}

function TeacherSigSelect({ label, role, selectedId, onSelect }: {
  label: string; role: string; selectedId: number | null; onSelect: (id: number | null) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>
        <span>{label}</span>
      </div>
      <TeacherSigSelectInner role={role} label={label} selectedId={selectedId} onSelect={onSelect} />
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
