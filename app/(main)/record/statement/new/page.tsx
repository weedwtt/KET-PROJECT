"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ChevronRight, ChevronLeft, User, Check } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
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
  teacher: {
    title: { name: string }
    firstName: string
    lastName: string
  }
}

type Student = {
  id: number
  studentCode: string
  classNumber: number
  gradeLevel: string
  classRoom: number
  firstName: string
  lastName: string
  nationalId: string
  birthDate: string
  phone: string | null
  nationality: string
  ethnicity: string
  religion: string
  bloodType: string | null
  addressHouseNo: string
  addressMoo: string | null
  addressVillage: string | null
  addressRoad: string | null
  addressSoi: string | null
  addressSubDistrict: string
  addressDistrict: string
  addressProvince: string
  addressPostalCode: string
  title: { name: string }
  guardians: Guardian[]
  advisors: Advisor[]
}

type SemesterItem = { id: number; name: string; value: number }
type AcademicYearItem = { id: number; year: number }
type ViolationCategoryItem = { id: number; name: string }
type ViolationSubCategoryItem = { id: number; name: string; violationCategoryId: number }
type TeacherOption = {
  id: number
  firstName: string
  lastName: string
  title: { name: string }
  signatureUrl: string | null
  role: string | null
  gradeHeadLevel: string | null
}

const GRADE_HEAD_LEVEL_LABEL: Record<string, string> = {
  M1: "ม.1", M2: "ม.2", M3: "ม.3", M4: "ม.4", M5: "ม.5", M6: "ม.6",
}

// ── Steps ──────────────────────────────────────────────────────────────────────

const STEPS = [
  { num: "01", label: "ข้อมูลนักเรียน",       en: "STUDENT"   },
  { num: "02", label: "รายละเอียดการกระทำผิด", en: "INCIDENT"  },
  { num: "03", label: "มาตรการ",               en: "MEASURES"  },
  { num: "04", label: "ลายเซ็น",               en: "SIGNATURES"},
]

// ── Form state types ───────────────────────────────────────────────────────────

type IncidentFormData = {
  semesterId: string
  semesterLabel: string
  academicYearId: string
  academicYearLabel: string
  violationCategoryId: string
  violationCategoryLabel: string
  violationSubCategoryId: string
  violationSubCategoryLabel: string
  behavior: string
  incidentDate: string
  incidentTime: string
  location: string
  advisor1Name: string
  advisor2Name: string
  recorder: string
}

type MeasureFormData = {
  consider: { notify: boolean; invite: boolean }
  result: {
    verbal: boolean
    deductScore: boolean
    deductPoints: string
    activity: boolean
    bond: boolean
  }
  notes: string
}

type SignatureFormData = {
  studentSignature: string
  guardianSignature: string
  advisorSignature: string
  disciplineTeacherId: number | null
  disciplineTeacherSignature: string
  gradeHeadTeacherId: number | null
  gradeHeadSignature: string
}

// ── Root page ──────────────────────────────────────────────────────────────────

export default function NewStatementPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Step 0 state
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Student[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [semesterId, setSemesterId] = useState("")
  const [semesterLabel, setSemesterLabel] = useState("")
  const [academicYearId, setAcademicYearId] = useState("")
  const [academicYearLabel, setAcademicYearLabel] = useState("")
  const [semesters, setSemesters] = useState<SemesterItem[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([])
  const [loadingSem, setLoadingSem] = useState(false)

  const [incident, setIncident] = useState<IncidentFormData>({
    semesterId: "", semesterLabel: "",
    academicYearId: "", academicYearLabel: "",
    violationCategoryId: "", violationCategoryLabel: "",
    violationSubCategoryId: "", violationSubCategoryLabel: "",
    behavior: "",
    incidentDate: "", incidentTime: "",
    location: "", advisor1Name: "", advisor2Name: "", recorder: "",
  })

  const [measures, setMeasures] = useState<MeasureFormData>({
    consider: { notify: false, invite: false },
    result: { verbal: false, deductScore: false, deductPoints: "", activity: false, bond: false },
    notes: "",
  })

  const [sigData, setSigData] = useState<SignatureFormData>({
    studentSignature: "", guardianSignature: "", advisorSignature: "",
    disciplineTeacherId: null, disciplineTeacherSignature: "",
    gradeHeadTeacherId: null, gradeHeadSignature: "",
  })

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load semesters/years for step 0
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
        setSearchError("ไม่พบนักเรียน กรุณาตรวจสอบรหัสหรือชื่ออีกครั้ง")
        setResults([])
      } else {
        setResults(data)
        if (data.length === 1) {
          setSelected(data[0])
          setQuery("")
          setResults(null)
        }
      }
    } catch {
      setSearchError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง")
    } finally {
      setSearching(false)
    }
  }

  const step0Valid = !!selected && !!semesterId && !!academicYearId

  async function handleSubmit() {
    if (!selected) return
    setSaving(true)
    setSaveError(null)

    const considerationMeasures: string[] = []
    if (measures.consider.notify) considerationMeasures.push("notify_parent")
    if (measures.consider.invite) considerationMeasures.push("invite_parent")

    const resultMeasures: string[] = []
    if (measures.result.verbal) resultMeasures.push("verbal_warning")
    if (measures.result.deductScore) resultMeasures.push("deduct_score")
    if (measures.result.activity) resultMeasures.push("behavior_activity")
    if (measures.result.bond) resultMeasures.push("probation_bond")

    const deductNote = measures.result.deductScore && measures.result.deductPoints
      ? `ตัดคะแนน ${measures.result.deductPoints} คะแนน`
      : ""
    const measureNotes = [deductNote, measures.notes].filter(Boolean).join("\n") || null

    const incidentDateTime = incident.incidentDate
      ? `${incident.incidentDate}T${incident.incidentTime || "00:00"}`
      : ""

    const subject = incident.behavior.trim().slice(0, 200)

    try {
      const res = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selected.id,
          semesterId,
          academicYearId,
          violationCategoryId: incident.violationCategoryId,
          violationSubCategoryId: incident.violationSubCategoryId || null,
          subject,
          detail: incident.behavior,
          incidentDateTime: incidentDateTime || null,
          location: incident.location || null,
          advisor1Name: incident.advisor1Name || null,
          advisor2Name: incident.advisor2Name || null,
          recorder: incident.recorder || null,
          considerationMeasures,
          resultMeasures,
          measureNotes,
          bond: null,
          studentSignature: sigData.studentSignature || null,
          guardianSignature: sigData.guardianSignature || null,
          advisorSignature: sigData.advisorSignature || null,
          disciplineTeacherId: sigData.disciplineTeacherId,
          disciplineTeacherSignature: sigData.disciplineTeacherSignature || null,
          gradeHeadTeacherId: sigData.gradeHeadTeacherId,
          gradeHeadSignature: sigData.gradeHeadSignature || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setSaveError(err.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่")
        toast.error(err.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่")
        return
      }
      toast.success("บันทึกถ้อยคำสำเร็จ")
      router.push("/record/statement")
    } catch {
      setSaveError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่")
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ks-page" style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/record/statement" className="btn btn-ghost btn-sm btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="page-eyebrow">บันทึกถ้อยคำ · สร้างใหม่</div>
            <h1>บันทึกถ้อยคำนักเรียน</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/record/statement" className="btn btn-ghost btn-sm">ยกเลิก</Link>
        </div>
      </div>

      {/* Film-frame stepper */}
      <WizardStepper currentStep={step} />

      {step === 0 && (
        <Step0Student
          query={query} setQuery={setQuery}
          searching={searching} results={results} error={searchError}
          onSearch={handleSearch}
          onSelectResult={(s) => { setSelected(s); setQuery(""); setResults(null) }}
          selected={selected} onClearStudent={() => setSelected(null)}
          semesters={semesters} academicYears={academicYears} loadingSem={loadingSem}
          semesterId={semesterId} setSemesterId={(v, lbl) => { setSemesterId(v); setSemesterLabel(lbl) }}
          academicYearId={academicYearId} setAcademicYearId={(v, lbl) => { setAcademicYearId(v); setAcademicYearLabel(lbl) }}
          isValid={step0Valid}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && selected && (
        <Step1Incident
          student={selected}
          data={incident} setData={setIncident}
          onBack={() => setStep(0)} onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <Step2Measures
          data={measures} setData={setMeasures}
          onBack={() => setStep(1)} onNext={() => setStep(3)}
        />
      )}
      {step === 3 && selected && (
        <Step3Signatures
          student={selected}
          data={sigData} setData={setSigData}
          saving={saving} saveError={saveError}
          onBack={() => setStep(2)} onSubmit={handleSubmit}
          notifyParent={measures.consider.notify && !measures.consider.invite}
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

// ── Step 0: Student ────────────────────────────────────────────────────────────

interface Step0Props {
  query: string
  setQuery: (v: string) => void
  searching: boolean
  results: Student[] | null
  error: string | null
  onSearch: (e: React.FormEvent) => void
  onSelectResult: (s: Student) => void
  selected: Student | null
  onClearStudent: () => void
  semesters: SemesterItem[]
  academicYears: AcademicYearItem[]
  loadingSem: boolean
  semesterId: string
  setSemesterId: (id: string, label: string) => void
  academicYearId: string
  setAcademicYearId: (id: string, label: string) => void
  isValid: boolean
  onNext: () => void
}

function Step0Student({
  query, setQuery, searching, results, error, onSearch, onSelectResult,
  selected, onClearStudent,
  semesters, academicYears, loadingSem,
  semesterId, setSemesterId, academicYearId, setAcademicYearId,
  isValid, onNext,
}: Step0Props) {
  const advisor1 = selected?.advisors.find((a) => a.slot === 1)?.teacher
  const advisor2 = selected?.advisors.find((a) => a.slot === 2)?.teacher

  function teacherName(t: { title: { name: string }; firstName: string; lastName: string }) {
    return `${t.title.name}${t.firstName} ${t.lastName}`
  }

  return (
    <div className="wizard-body">
      <h2 className="step-heading">ค้นหาและเลือกนักเรียน</h2>
      <p className="step-sub">พิมพ์รหัสนักเรียน ชื่อ-สกุล หรือชั้นเรียน เพื่อค้นหา</p>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
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
              autoFocus={!selected}
              disabled={searching}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!query.trim() || searching}>
            {searching ? <SpinIcon /> : <Search size={14} />} ค้นหา
          </button>
        </form>
        {error && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--rose-wash, #fff0f0)", border: "1px solid var(--rose)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--rose)" }}>
            {error}
          </div>
        )}
      </div>

      {/* Search results dropdown */}
      {results && results.length > 1 && !selected && (
        <div style={{ border: "1px solid var(--rule)", borderRadius: "var(--radius)", marginBottom: 20, overflow: "hidden", background: "var(--surface-2)" }}>
          {results.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectResult(s)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", borderBottom: "1px solid var(--rule-soft)", cursor: "pointer", textAlign: "left" }}
            >
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

      {/* Selected student card */}
      {selected && (
        <div className="ks-card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", padding: 20, gap: 16, alignItems: "flex-start" }}>
            <div style={{ width: 52, height: 52, background: "var(--indigo)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  STUDENT · {selected.studentCode}
                </span>
                <span className="chip chip-approved" style={{ height: 20, fontSize: 11 }}>ตรงกัน</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.005em", marginBottom: 2 }}>
                {selected.title.name}{selected.firstName} {selected.lastName}
              </div>
              <div style={{ color: "var(--ink-2)", fontSize: 13.5 }}>
                ชั้น {selected.gradeLevel}/{selected.classRoom} · เลขที่ {selected.classNumber}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClearStudent}>
              เปลี่ยน
            </button>
          </div>
          <div style={{ padding: "0 20px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, borderTop: "1px solid var(--rule-soft)", paddingTop: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.07em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 4 }}>ผู้ปกครอง</div>
              {selected.guardians.length === 0 ? (
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>—</div>
              ) : (
                selected.guardians.map((g) => (
                  <div key={g.id} style={{ fontSize: 13.5, fontWeight: 500 }}>
                    {g.firstName} {g.lastName}
                    <span style={{ fontSize: 12, fontWeight: 400, color: "var(--ink-3)", marginLeft: 6 }}>({g.relation.name})</span>
                  </div>
                ))
              )}
            </div>
            <div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.07em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 4 }}>ครูที่ปรึกษา</div>
              {advisor1 ? (
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{teacherName(advisor1)}</div>
              ) : (
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>—</div>
              )}
              {advisor2 && (
                <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 2 }}>{teacherName(advisor2)}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.07em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 4 }}>ชั้น / เลขที่</div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                {selected.gradeLevel}/{selected.classRoom} · #{selected.classNumber}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Semester / Year */}
      <div style={{ borderTop: "1px solid var(--rule-soft)", paddingTop: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>ภาคเรียน / ปีการศึกษา</div>
        {loadingSem ? (
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>กำลังโหลด...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel required>ภาคเรียน</FieldLabel>
              <select
                className="ks-select"
                value={semesterId}
                onChange={(e) => {
                  const found = semesters.find((s) => String(s.id) === e.target.value)
                  setSemesterId(e.target.value, found?.name ?? "")
                }}
              >
                <option value="" disabled>เลือกภาคเรียน</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel required>ปีการศึกษา</FieldLabel>
              <select
                className="ks-select"
                value={academicYearId}
                onChange={(e) => {
                  const found = academicYears.find((a) => String(a.id) === e.target.value)
                  setAcademicYearId(e.target.value, found ? String(found.year) : "")
                }}
              >
                <option value="" disabled>เลือกปีการศึกษา</option>
                {academicYears.map((a) => <option key={a.id} value={a.id}>{a.year}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="wizard-actions">
        <div />
        <button className="btn btn-primary" onClick={onNext} disabled={!isValid} style={{ opacity: isValid ? 1 : 0.5 }}>
          ถัดไป — รายละเอียดการกระทำผิด <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Step 1: Incident ───────────────────────────────────────────────────────────

function Step1Incident({
  student, data, setData, onBack, onNext,
}: {
  student: Student
  data: IncidentFormData
  setData: React.Dispatch<React.SetStateAction<IncidentFormData>>
  onBack: () => void
  onNext: () => void
}) {
  const [categories, setCategories] = useState<ViolationCategoryItem[]>([])
  const [subCategories, setSubCategories] = useState<ViolationSubCategoryItem[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [recorders, setRecorders] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    fetch("/api/master/violation-categories")
      .then((r) => r.json())
      .then((data) => { setCategories(data); setLoadingCats(false) })
      .catch(() => setLoadingCats(false))
    fetch("/api/master/recorders")
      .then((r) => r.json())
      .then(setRecorders)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!data.violationCategoryId) { setSubCategories([]); return }
    setLoadingSubs(true)
    fetch(`/api/master/violation-sub-categories?categoryId=${data.violationCategoryId}`)
      .then((r) => r.json())
      .then((subs) => { setSubCategories(subs); setLoadingSubs(false) })
      .catch(() => setLoadingSubs(false))
  }, [data.violationCategoryId])

  function upd(fields: Partial<IncidentFormData>) {
    setData((prev) => ({ ...prev, ...fields }))
  }

  const isValid =
    !!data.violationCategoryId && !!data.behavior.trim() && !!data.incidentDate

  const advisor1 = student.advisors.find((a) => a.slot === 1)?.teacher
  const advisor2 = student.advisors.find((a) => a.slot === 2)?.teacher

  function advisorName(t: { title: { name: string }; firstName: string; lastName: string }) {
    return `${t.title.name}${t.firstName} ${t.lastName}`
  }

  // Pre-fill advisor names on mount
  useEffect(() => {
    const updates: Partial<IncidentFormData> = {}
    if (!data.advisor1Name && advisor1) updates.advisor1Name = advisorName(advisor1)
    if (!data.advisor2Name && advisor2) updates.advisor2Name = advisorName(advisor2)
    if (Object.keys(updates).length > 0) upd(updates)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="wizard-body">
      <StudentMiniCard student={student} />
      <h2 className="step-heading" style={{ marginTop: 20 }}>รายละเอียดการกระทำผิด</h2>
      <p className="step-sub">เลือกหมวดและกรอกรายละเอียดเหตุการณ์ที่เกิดขึ้นให้ครบถ้วน</p>

      {loadingCats ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "var(--ink-3)" }}>กำลังโหลด...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel required>หมวดการผิดระเบียบ</FieldLabel>
              <select
                className="ks-select"
                value={data.violationCategoryId}
                onChange={(e) => {
                  const found = categories.find((c) => String(c.id) === e.target.value)
                  upd({ violationCategoryId: e.target.value, violationCategoryLabel: found?.name ?? "", violationSubCategoryId: "", violationSubCategoryLabel: "" })
                }}
              >
                <option value="" disabled>เลือกหมวด</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>เรื่อง</FieldLabel>
              {loadingSubs ? (
                <div style={{ height: 38, background: "var(--surface-2)", borderRadius: "var(--radius)", animation: "pulse 1.5s infinite" }} />
              ) : subCategories.length === 0 ? (
                <div className="ks-input" style={{ color: "var(--ink-4)", pointerEvents: "none" }}>—</div>
              ) : (
                <select
                  className="ks-select"
                  value={data.violationSubCategoryId}
                  onChange={(e) => {
                    const found = subCategories.find((s) => String(s.id) === e.target.value)
                    upd({ violationSubCategoryId: e.target.value, violationSubCategoryLabel: found?.name ?? "" })
                  }}
                >
                  <option value="">เลือกหมวดย่อย (ถ้ามี)</option>
                  {subCategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
          </div>

          <div>
            <FieldLabel required>รายละเอียดพฤติกรรม</FieldLabel>
            <textarea
              className="ks-textarea"
              value={data.behavior}
              onChange={(e) => upd({ behavior: e.target.value })}
              placeholder="เล่ารายละเอียดเหตุการณ์ บุคคลที่เกี่ยวข้อง และข้อเท็จจริงที่สังเกตได้"
              rows={5}
              style={{ resize: "vertical" }}
            />
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 6, display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)" }}>
              <span>เคล็ดลับ: ใช้ข้อเท็จจริง หลีกเลี่ยงการตัดสิน</span>
              <span>{data.behavior.length} / 1000</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel required>วันที่เกิดเหตุ</FieldLabel>
              <DatePicker
                value={data.incidentDate}
                onChange={(v) => upd({ incidentDate: v })}
                placeholder="เลือกวันที่เกิดเหตุ"
              />
            </div>
            <div>
              <FieldLabel>เวลา</FieldLabel>
              <input
                className="ks-input"
                type="time"
                value={data.incidentTime}
                onChange={(e) => upd({ incidentTime: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>สถานที่เกิดเหตุ</FieldLabel>
              <input
                className="ks-input"
                value={data.location}
                onChange={(e) => upd({ location: e.target.value })}
                placeholder="เช่น อาคาร 3 ห้อง 302"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel>ครูที่ปรึกษาคนที่ 1</FieldLabel>
              <input
                className="ks-input"
                value={data.advisor1Name}
                onChange={(e) => upd({ advisor1Name: e.target.value })}
                placeholder="ชื่อ-นามสกุลครูที่ปรึกษา"
              />
            </div>
            <div>
              <FieldLabel>ครูที่ปรึกษาคนที่ 2</FieldLabel>
              <input
                className="ks-input"
                value={data.advisor2Name}
                onChange={(e) => upd({ advisor2Name: e.target.value })}
                placeholder="ชื่อ-นามสกุลครูที่ปรึกษา"
              />
            </div>
          </div>

          <div>
            <FieldLabel>ผู้บันทึก</FieldLabel>
            <select
              className="ks-select"
              value={data.recorder}
              onChange={(e) => upd({ recorder: e.target.value })}
            >
              <option value="">— เลือกผู้บันทึก —</option>
              {recorders.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={onBack}><ChevronLeft size={14} /> ย้อนกลับ</button>
        <button className="btn btn-primary" onClick={onNext} disabled={!isValid} style={{ opacity: isValid ? 1 : 0.5 }}>
          ถัดไป — มาตรการ <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Measures ───────────────────────────────────────────────────────────

function Step2Measures({
  data, setData, onBack, onNext,
}: {
  data: MeasureFormData
  setData: React.Dispatch<React.SetStateAction<MeasureFormData>>
  onBack: () => void
  onNext: () => void
}) {
  function updConsider(k: keyof typeof data.consider, v: boolean) {
    setData((p) => ({ ...p, consider: { ...p.consider, [k]: v } }))
  }
  function updResult(k: keyof typeof data.result, v: boolean | string) {
    setData((p) => ({ ...p, result: { ...p.result, [k]: v } }))
  }

  return (
    <div className="wizard-body">
      <h2 className="step-heading">มาตรการที่กำหนด</h2>
      <p className="step-sub">เลือกมาตรการให้สอดคล้องกับระเบียบโรงเรียนและความรุนแรงของการกระทำผิด</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
        {/* A · CONSIDER */}
        <MeasureBlock marker="A · CONSIDER" title="มาตรการพิจารณา">
          <CheckRow
            checked={data.consider.notify}
            onChange={(v) => updConsider("notify", v)}
            label="แจ้งผู้ปกครองทราบ"
          />
          <CheckRow
            checked={data.consider.invite}
            onChange={(v) => updConsider("invite", v)}
            label="เชิญผู้ปกครองมาพบ"
          />
        </MeasureBlock>

        {/* B · RESULT */}
        <MeasureBlock marker="B · RESULT" title="ผลการพิจารณา">
          <CheckRow
            checked={data.result.verbal}
            onChange={(v) => updResult("verbal", v)}
            label="ตักเตือนด้วยวาจา"
          />
          <CheckRow
            checked={data.result.deductScore}
            onChange={(v) => updResult("deductScore", v)}
            label="ตัดคะแนนความประพฤติ"
          >
            {data.result.deductScore && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginTop: 8 }}>
                <input
                  className="ks-input"
                  type="number" min={1} max={100}
                  style={{ width: 80, height: 32 }}
                  value={data.result.deductPoints}
                  onChange={(e) => updResult("deductPoints", e.target.value)}
                  placeholder="0"
                />
                <span style={{ color: "var(--ink-2)" }}>คะแนน</span>
              </div>
            )}
          </CheckRow>
          <CheckRow
            checked={data.result.activity}
            onChange={(v) => updResult("activity", v)}
            label="ทำกิจกรรมพัฒนาพฤติกรรม"
          />
          <CheckRow
            checked={data.result.bond}
            onChange={(v) => updResult("bond", v)}
            label="ทำทัณฑ์บน"
          />
        </MeasureBlock>
      </div>

      <div>
        <FieldLabel>หมายเหตุมาตรการ</FieldLabel>
        <textarea
          className="ks-textarea"
          value={data.notes}
          onChange={(e) => setData((p) => ({ ...p, notes: e.target.value }))}
          placeholder="ระบุข้อพิจารณาเพิ่มเติม หรือเงื่อนไขพิเศษที่กำหนดไว้"
          rows={3}
        />
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

function MeasureBlock({ title, children }: { marker?: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--rule)", borderRadius: 6, padding: 20 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 16, color: "var(--ink)" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  )
}

function CheckRow({
  checked, onChange, label, children,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; children?: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: checked ? "var(--indigo)" : "transparent",
          border: `2px solid ${checked ? "var(--indigo)" : "var(--rule-2)"}`,
        }}>
          {checked && <Check size={11} color="#fff" />}
        </div>
        <input type="checkbox" style={{ display: "none" }} checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span style={{ fontSize: 13.5, color: "var(--ink)" }}>{label}</span>
      </label>
      {children && <div style={{ marginLeft: 28 }}>{children}</div>}
    </div>
  )
}

// ── Step 3: Signatures ─────────────────────────────────────────────────────────

function Step3Signatures({
  student, data, setData, saving, saveError, onBack, onSubmit, notifyParent,
}: {
  student: Student
  data: SignatureFormData
  setData: React.Dispatch<React.SetStateAction<SignatureFormData>>
  saving: boolean
  saveError: string | null
  onBack: () => void
  onSubmit: () => void
  notifyParent: boolean
}) {
  const advisor1 = student.advisors.find((a) => a.slot === 1)?.teacher
  const advisor2 = student.advisors.find((a) => a.slot === 2)?.teacher
  const advisorName = [advisor1, advisor2].filter(Boolean).map((t) => `${t!.title.name}${t!.firstName} ${t!.lastName}`).join(" | ") || "ครูที่ปรึกษา"

  const guardian = student.guardians[0]
  const guardianName = guardian ? `${guardian.firstName} ${guardian.lastName}` : "ผู้ปกครอง"
  const studentName = `${student.title.name}${student.firstName} ${student.lastName}`

  function setSig(field: keyof Pick<SignatureFormData, "studentSignature" | "guardianSignature" | "advisorSignature">, val: string) {
    setData((p) => ({ ...p, [field]: val }))
  }

  return (
    <div className="wizard-body">
      <StudentMiniCard student={student} />
      <h2 className="step-heading" style={{ marginTop: 20 }}>ลายเซ็นทุกฝ่าย</h2>
      <p className="step-sub">ทุกฝ่ายลงลายมือชื่อในช่องที่กำหนด แล้วกด "ยืนยันลายเซ็น"</p>

      <div style={{ display: "grid", gridTemplateColumns: notifyParent ? "1fr 1fr" : "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
        <SigPad
          label="นักเรียน"
          name={studentName}
          value={data.studentSignature}
          onChange={(v) => setSig("studentSignature", v)}
          onClear={() => setSig("studentSignature", "")}
        />
        {!notifyParent && (
          <SigPad
            label="ผู้ปกครอง"
            value={data.guardianSignature}
            onChange={(v) => setSig("guardianSignature", v)}
            onClear={() => setSig("guardianSignature", "")}
          />
        )}
        <SigPad
          label="ครูที่ปรึกษา"
          name={advisorName}
          value={data.advisorSignature}
          onChange={(v) => setSig("advisorSignature", v)}
          onClear={() => setSig("advisorSignature", "")}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <DisciplineTeacherSigSection
          selectedId={data.disciplineTeacherId}
          onSelect={(id) => setData((p) => ({ ...p, disciplineTeacherId: id, disciplineTeacherSignature: "" }))}
          liveSignature={data.disciplineTeacherSignature}
          onLiveSign={(url) => setData((p) => ({ ...p, disciplineTeacherSignature: url, disciplineTeacherId: null }))}
          onLiveClear={() => setData((p) => ({ ...p, disciplineTeacherSignature: "" }))}
        />
        <GradeHeadSigSection
          selectedId={data.gradeHeadTeacherId}
          onSelect={(id) => setData((p) => ({ ...p, gradeHeadTeacherId: id, gradeHeadSignature: "" }))}
          liveSignature={data.gradeHeadSignature}
          onLiveSign={(url) => setData((p) => ({ ...p, gradeHeadSignature: url, gradeHeadTeacherId: null }))}
          onLiveClear={() => setData((p) => ({ ...p, gradeHeadSignature: "" }))}
        />
      </div>

      <div style={{ padding: "12px 16px", background: "var(--indigo-wash)", borderRadius: "var(--radius)", fontSize: 12.5, color: "var(--indigo-ink)", display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        ลายเซ็นจะถูกบันทึกพร้อมวันเวลาเพื่อใช้ในการตรวจสอบในภายหลัง
      </div>

      {saveError && (
        <div style={{ padding: "10px 14px", background: "var(--rose-wash, #fff0f0)", border: "1px solid var(--rose)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--rose)", marginBottom: 16 }}>
          {saveError}
        </div>
      )}

      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={onBack} disabled={saving}><ChevronLeft size={14} /> ย้อนกลับ</button>
        <button
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={saving}
          aria-busy={saving}
          style={{ background: "var(--sage, #059669)" }}
        >
          {saving ? <><SpinIcon /> กำลังบันทึก...</> : <><Check size={14} /> ยืนยันและบันทึก</>}
        </button>
      </div>
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
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault(); drawing.current = true
    const ctx = canvasRef.current!.getContext("2d")!
    const { x, y } = getXY(e)
    ctx.beginPath(); ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "var(--ink)"
    const { x, y } = getXY(e)
    ctx.lineTo(x, y); ctx.stroke()
  }

  function stopDraw() { drawing.current = false }

  function clear() {
    canvasRef.current?.getContext("2d")?.clearRect(0, 0, 600, 160)
    onClear()
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <span>§ ลายเซ็น{label}</span>
        <span style={{ color: value ? "var(--sage)" : "var(--ink-4)" }}>{value ? "● ลงนามแล้ว" : "○ ยังไม่ลงนาม"}</span>
      </div>
      <div className="sig-pad" style={{ height: 140, border: value ? "1px solid var(--sage)" : undefined, background: value ? "var(--sage-wash, #f0fdf4)" : undefined, cursor: "crosshair" }}>
        {value ? (
          <img src={value} alt="sig" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
        ) : (
          <canvas
            ref={canvasRef} width={600} height={160}
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
      {name && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500 }}>{name}</div>}
    </div>
  )
}

// ── DisciplineTeacherSigSection ────────────────────────────────────────────────

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

  function switchToSystem() {
    setMode("system")
    onLiveClear()
  }

  function switchToLive() {
    setMode("live")
    onSelect(null)
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>§ ลายเซ็นครูฝ่ายปกครอง</span>
        {(selectedId || liveSignature) && <span style={{ color: "var(--sage)" }}>● เลือกแล้ว</span>}
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "var(--surface-2)", borderRadius: "var(--radius)", padding: 3, width: "fit-content" }}>
        <button
          type="button"
          onClick={switchToSystem}
          style={{
            padding: "4px 12px", fontSize: 12, borderRadius: "calc(var(--radius) - 2px)", border: "none",
            cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
            background: mode === "system" ? "var(--surface)" : "transparent",
            color: mode === "system" ? "var(--ink)" : "var(--ink-3)",
            boxShadow: mode === "system" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
          }}
        >
          ดึงจากระบบ
        </button>
        <button
          type="button"
          onClick={switchToLive}
          style={{
            padding: "4px 12px", fontSize: 12, borderRadius: "calc(var(--radius) - 2px)", border: "none",
            cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
            background: mode === "live" ? "var(--surface)" : "transparent",
            color: mode === "live" ? "var(--ink)" : "var(--ink-3)",
            boxShadow: mode === "live" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
          }}
        >
          เซ็นสด
        </button>
      </div>

      {mode === "system" ? (
        <TeacherSigSelectInner
          role="DISCIPLINE"
          label="ครูฝ่ายปกครอง"
          selectedId={selectedId}
          onSelect={onSelect}
          hideSignature
        />
      ) : (
        <SigPad
          label="ครูฝ่ายปกครอง"
          value={liveSignature}
          onChange={onLiveSign}
          onClear={onLiveClear}
        />
      )}
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

  function switchToSystem() {
    setMode("system")
    onLiveClear()
  }

  function switchToLive() {
    setMode("live")
    onSelect(null)
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>§ ลายเซ็นหัวหน้าระดับ</span>
        {(selectedId || liveSignature) && <span style={{ color: "var(--sage)" }}>● เลือกแล้ว</span>}
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "var(--surface-2)", borderRadius: "var(--radius)", padding: 3, width: "fit-content" }}>
        <button
          type="button"
          onClick={switchToSystem}
          style={{
            padding: "4px 12px", fontSize: 12, borderRadius: "calc(var(--radius) - 2px)", border: "none",
            cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
            background: mode === "system" ? "var(--surface)" : "transparent",
            color: mode === "system" ? "var(--ink)" : "var(--ink-3)",
            boxShadow: mode === "system" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
          }}
        >
          ดึงจากระบบ
        </button>
        <button
          type="button"
          onClick={switchToLive}
          style={{
            padding: "4px 12px", fontSize: 12, borderRadius: "calc(var(--radius) - 2px)", border: "none",
            cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
            background: mode === "live" ? "var(--surface)" : "transparent",
            color: mode === "live" ? "var(--ink)" : "var(--ink-3)",
            boxShadow: mode === "live" ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
          }}
        >
          เซ็นสด
        </button>
      </div>

      {mode === "system" ? (
        <TeacherSigSelectInner
          role="หัวหน้าระดับชั้น"
          selectedId={selectedId}
          onSelect={onSelect}
          hideSignature
        />
      ) : (
        <SigPad
          label="หัวหน้าระดับชั้น"
          value={liveSignature}
          onChange={onLiveSign}
          onClear={onLiveClear}
        />
      )}
    </div>
  )
}

// ── TeacherSigSelect ───────────────────────────────────────────────────────────

function TeacherSigSelectInner({ role, label, selectedId, onSelect, hideSignature }: {
  role: string; label?: string; selectedId: number | null
  onSelect: (id: number | null) => void
  hideSignature?: boolean
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
      ) : teachers.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--ink-4)" }}>ไม่พบครูที่มีบทบาทนี้</div>
      ) : (
        <select
          className="ks-select"
          value={selectedId ?? ""}
          onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">เลือก{label ?? role}</option>
          {teachers.map((t) => {
            const gradeLabel = t.gradeHeadLevel ? ` (${GRADE_HEAD_LEVEL_LABEL[t.gradeHeadLevel] ?? t.gradeHeadLevel})` : ""
            return (
              <option key={t.id} value={t.id}>{t.title.name}{t.firstName} {t.lastName}{gradeLabel}</option>
            )
          })}
        </select>
      )}
      {!hideSignature && selected && (
        <div className="sig-display" style={{ marginTop: 10, borderColor: selected.signatureUrl ? "var(--sage)" : undefined }}>
          {selected.signatureUrl
            ? <img src={selected.signatureUrl} alt="sig" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ยังไม่มีลายเซ็นในระบบ</span>}
          <span className="sig-name">{selected.title.name}{selected.firstName} {selected.lastName}</span>
        </div>
      )}
      {hideSignature && selected && (
        <div style={{
          marginTop: 10, padding: "10px 14px",
          background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)",
          borderRadius: "var(--radius)", fontSize: 13,
        }}>
          <div style={{ fontWeight: 600, color: "var(--indigo)", marginBottom: 2 }}>
            {selected.title.name}{selected.firstName} {selected.lastName}
            {selected.gradeHeadLevel ? ` (${GRADE_HEAD_LEVEL_LABEL[selected.gradeHeadLevel] ?? selected.gradeHeadLevel})` : ""}
          </div>
          <div style={{ fontSize: 12, color: "var(--indigo-ink)" }}>
            จะได้รับแบบฟอร์มเพื่ออนุมัติและลงลายเซ็นก่อนส่งต่อให้ผู้อำนวยการ
          </div>
        </div>
      )}
    </>
  )
}

function TeacherSigSelect({ label, role, selectedId, onSelect }: {
  label: string; role: string; selectedId: number | null
  onSelect: (id: number | null) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <span>§ ลายเซ็น{label}</span>
      </div>
      <TeacherSigSelectInner role={role} label={label} selectedId={selectedId} onSelect={onSelect} />
    </div>
  )
}

// ── Shared components ──────────────────────────────────────────────────────────

function StudentMiniCard({ student }: { student: Student }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
      background: "var(--indigo-wash)", borderRadius: "var(--radius)", border: "1px solid var(--periwinkle)",
    }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--indigo)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <User size={15} color="#fff" />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{student.title.name}{student.firstName} {student.lastName}</div>
        <div style={{ fontSize: 12, color: "var(--indigo-ink)", fontFamily: "var(--font-mono)" }}>
          {student.studentCode} · ชั้น {student.gradeLevel}/{student.classRoom} · เลขที่ {student.classNumber}
        </div>
      </div>
    </div>
  )
}

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
