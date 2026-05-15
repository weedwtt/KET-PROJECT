"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Search, ChevronRight, ChevronLeft, User, Users, MapPin,
  Check, FileText, ShieldAlert, ScrollText, CheckCircle2,
} from "lucide-react"

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

const STEPS = [
  { label: "ค้นหานักเรียน", code: "S01" },
  { label: "ข้อมูลนักเรียน", code: "S02" },
  { label: "บันทึกถ้อยคำ",   code: "S03" },
  { label: "มาตรการ",        code: "S04" },
  { label: "ทำทัณฑ์บน",     code: "S05" },
  { label: "ลงนาม",          code: "S06" },
  { label: "ยืนยัน",         code: "S07" },
]

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
]

const CONSIDERATION_MEASURES = [
  { id: "notify_parent",  label: "แจ้งผู้ปกครอง" },
  { id: "invite_parent",  label: "เชิญผู้ปกครองรับทราบพฤติกรรม" },
]

const RESULT_MEASURES = [
  { id: "verbal_warning",    label: "ตักเตือน" },
  { id: "deduct_score",      label: "ตัดคะแนนความประพฤติ" },
  { id: "behavior_activity", label: "ทำกิจกรรมปรับเปลี่ยนพฤติกรรม" },
  { id: "probation_bond",    label: "ทำทัณฑ์บน" },
]

const BOND_PENALTY_OPTIONS = [
  { id: "deduct_score",  label: "ตัดคะแนนความประพฤติ" },
  { id: "behavior_camp", label: "ทำกิจกรรมค่ายปรับพฤติกรรม" },
  { id: "suspension",    label: "พักการเรียน" },
  { id: "transfer",      label: "ย้ายสถานศึกษา" },
]

// ── Form data types ────────────────────────────────────────────────────────────

type StatementFormData = {
  semesterId: string
  semesterLabel: string
  academicYearId: string
  academicYearLabel: string
  violationCategoryId: string
  violationCategoryLabel: string
  violationSubCategoryId: string
  violationSubCategoryLabel: string
  subject: string
  detail: string
  incidentDateTime: string
  location: string
  recorder: string
}

type MeasureFormData = {
  selected: string[]
  notes: string
}

type BondFormData = {
  selectedGuardianIndex: number | null
  penaltyActions: string[]
  deductPoints: string
  witnessName: string
}

type TeacherOption = {
  id: number
  firstName: string
  lastName: string
  title: { name: string }
  signatureUrl: string | null
  role: string | null
}

type SignatureFormData = {
  studentSignature: string
  guardianSignature: string
  advisorSignature: string
  disciplineTeacherId: number | null
  gradeHeadTeacherId: number | null
}

// ── Root page ──────────────────────────────────────────────────────────────────

export default function NewStatementPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Student[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [formData, setFormData] = useState<StatementFormData>({
    semesterId: "", semesterLabel: "",
    academicYearId: "", academicYearLabel: "",
    violationCategoryId: "", violationCategoryLabel: "",
    violationSubCategoryId: "", violationSubCategoryLabel: "",
    subject: "", detail: "", incidentDateTime: "", location: "", recorder: "",
  })

  const [measureData, setMeasureData] = useState<MeasureFormData>({ selected: [], notes: "" })

  const [bondData, setBondData] = useState<BondFormData>({
    selectedGuardianIndex: null, penaltyActions: [], deductPoints: "", witnessName: "",
  })

  const [signatureData, setSignatureData] = useState<SignatureFormData>({
    studentSignature: "", guardianSignature: "", advisorSignature: "",
    disciplineTeacherId: null, gradeHeadTeacherId: null,
  })

  const showBondStep = measureData.selected.includes("probation_bond")

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
      } else if (data.length === 1) {
        selectStudent(data[0])
      } else {
        setResults(data)
      }
    } catch {
      setSearchError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง")
    } finally {
      setSearching(false)
    }
  }

  function selectStudent(student: Student) {
    setSelected(student)
    setStep(1)
  }

  function handleBack() {
    if (step === 1) setSelected(null)
    setStep((s) => Math.max(0, s - 1))
  }

  function handleNext() {
    if (step === 3 && !showBondStep) { setStep(5); return }
    setStep((s) => s + 1)
  }

  function handleNextFromBond() { setStep(5) }

  function handleBackFromSignatures() {
    setStep(showBondStep ? 4 : 3)
  }

  function handleNextFromSignatures() { setStep(6) }
  function handleBackFromConfirm() { setStep(5) }

  async function handleSubmit() {
    if (!selected) return
    setSaving(true)
    setSaveError(null)
    const bondGuardianId =
      showBondStep && bondData.selectedGuardianIndex !== null
        ? (selected.guardians[bondData.selectedGuardianIndex]?.id ?? null)
        : null
    try {
      const res = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selected.id,
          semesterId: formData.semesterId,
          academicYearId: formData.academicYearId,
          violationCategoryId: formData.violationCategoryId,
          violationSubCategoryId: formData.violationSubCategoryId || null,
          subject: formData.subject,
          detail: formData.detail,
          incidentDateTime: formData.incidentDateTime,
          location: formData.location,
          recorder: formData.recorder,
          considerationMeasures: measureData.selected.filter((id) => CONSIDERATION_MEASURES.some((m) => m.id === id)),
          resultMeasures: measureData.selected.filter((id) => RESULT_MEASURES.some((m) => m.id === id)),
          measureNotes: measureData.notes || null,
          bond: showBondStep && bondGuardianId
            ? { guardianId: bondGuardianId, penaltyActions: bondData.penaltyActions,
                deductPoints: bondData.deductPoints ? Number(bondData.deductPoints) : null,
                witnessName: bondData.witnessName || null }
            : null,
          studentSignature: signatureData.studentSignature || null,
          guardianSignature: signatureData.guardianSignature || null,
          advisorSignature: signatureData.advisorSignature || null,
          disciplineTeacherId: signatureData.disciplineTeacherId,
          gradeHeadTeacherId: signatureData.gradeHeadTeacherId,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setSaveError(err.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่")
        return
      }
      router.push("/record/statement")
    } catch {
      setSaveError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่")
    } finally {
      setSaving(false)
    }
  }

  const displayStep = !showBondStep && step >= 5 ? step - 1 : step

  return (
    <div className="ks-page" style={{ maxWidth: 780 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/record/statement" className="btn btn-ghost btn-sm btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="page-eyebrow">
              
              <span>บันทึกถ้อยคำ · เพิ่มรายการใหม่</span>
            </div>
            <h1>เพิ่มบันทึกถ้อยคำ</h1>
          </div>
        </div>
      </div>

      <WizardStepper currentStep={displayStep} showBondStep={showBondStep} />

      {step === 0 && (
        <Step1Search
          query={query} setQuery={setQuery} searching={searching}
          results={results} error={searchError}
          onSearch={handleSearch} onSelect={selectStudent}
        />
      )}
      {step === 1 && selected && (
        <Step2Student student={selected} onBack={handleBack} onNext={handleNext} />
      )}
      {step === 2 && selected && (
        <Step3Statement
          student={selected} formData={formData} setFormData={setFormData}
          onBack={handleBack} onNext={handleNext}
        />
      )}
      {step === 3 && (
        <Step4Measures
          measureData={measureData} setMeasureData={setMeasureData}
          onBack={handleBack} onNext={handleNext}
        />
      )}
      {step === 4 && showBondStep && selected && (
        <Step5Bond
          student={selected} formData={formData} bondData={bondData}
          setBondData={setBondData} onBack={handleBack} onNext={handleNextFromBond}
        />
      )}
      {step === 5 && selected && (
        <Step5Signature
          student={selected} signatureData={signatureData}
          setSignatureData={setSignatureData}
          onBack={handleBackFromSignatures} onNext={handleNextFromSignatures}
        />
      )}
      {step === 6 && selected && (
        <Step6Confirm
          student={selected} formData={formData} measureData={measureData}
          bondData={bondData} showBondStep={showBondStep}
          saving={saving} saveError={saveError}
          onBack={handleBackFromConfirm} onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// ── Stepper ────────────────────────────────────────────────────────────────────

function WizardStepper({ currentStep, showBondStep }: { currentStep: number; showBondStep?: boolean }) {
  const visible = STEPS.filter((_, i) => i !== 4 || showBondStep)
  const indices = STEPS.map((_, i) => i).filter((i) => i !== 4 || showBondStep)

  return (
    <div className="wizard-stepper">
      <div className="wizard-frame">
        {visible.map((s, vi) => {
          const ai = indices[vi]
          const state =
            vi < currentStep ? "complete" :
            vi === currentStep ? "current" :
            (ai === 4 && !showBondStep) ? "disabled" : ""
          return (
            <div key={ai} className={`wizard-step ${state}`}>
              <div className="step-tick" />
              <div className="step-meta">
                <span className="step-num">{vi < currentStep ? "✓" : vi + 1}</span>
                {s.code}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 1: Search ─────────────────────────────────────────────────────────────

interface Step1Props {
  query: string
  setQuery: (v: string) => void
  searching: boolean
  results: Student[] | null
  error: string | null
  onSearch: (e: React.FormEvent) => void
  onSelect: (s: Student) => void
}

function Step1Search({ query, setQuery, searching, results, error, onSearch, onSelect }: Step1Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <div className="wizard-body">
        <h2 className="step-heading">ค้นหานักเรียน</h2>
        <p className="step-sub">พิมพ์รหัสประจำตัวนักเรียน หรือ ชื่อ-นามสกุล</p>

        <form onSubmit={onSearch} style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }} />
            <input
              className="ks-input"
              style={{ paddingLeft: 42 }}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="เช่น 42344 หรือ สมชาย"
              autoFocus
              disabled={searching}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!query.trim() || searching}>
            {searching
              ? <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <Search size={15} />}
            ค้นหา
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--rose-wash, #fff0f0)", border: "1px solid var(--rose)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--rose)" }}>
            {error}
          </div>
        )}
      </div>

      {results && results.length > 1 && (
        <div className="ks-card">
          <div className="ks-card-header">
            <div>
              <div className="eyebrow">พบ {results.length} รายการ</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>เลือกนักเรียนที่ต้องการบันทึก</div>
            </div>
          </div>
          <div>
            {results.map((s) => (
              <button
                key={s.id}
                className="student-result"
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--rule-soft)", cursor: "pointer" }}
                onClick={() => onSelect(s)}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--indigo-wash)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={16} style={{ color: "var(--indigo)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{s.title.name}{s.firstName} {s.lastName}</div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {s.studentCode} · {s.gradeLevel}/{s.classRoom} · เลขที่ {s.classNumber}
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Step 2: Confirm student ────────────────────────────────────────────────────

function Step2Student({ student, onBack, onNext }: { student: Student; onBack: () => void; onNext: () => void }) {
  const fullName = `${student.title.name}${student.firstName} ${student.lastName}`
  const advisor1 = student.advisors.find((a) => a.slot === 1)?.teacher
  const advisor2 = student.advisors.find((a) => a.slot === 2)?.teacher
  const father = student.guardians.find((g) => g.relation.name === "พ่อ")
  const mother = student.guardians.find((g) => g.relation.name === "แม่")
  const other = student.guardians.find((g) => g.relation.name !== "พ่อ" && g.relation.name !== "แม่")
  const address = [
    student.addressHouseNo && `บ้านเลขที่ ${student.addressHouseNo}`,
    student.addressMoo && `หมู่ ${student.addressMoo}`,
    student.addressVillage && `บ้าน${student.addressVillage}`,
    student.addressSoi && `ซอย${student.addressSoi}`,
    student.addressRoad && `ถนน${student.addressRoad}`,
    `ต.${student.addressSubDistrict}`,
    `อ.${student.addressDistrict}`,
    `จ.${student.addressProvince}`,
    student.addressPostalCode,
  ].filter(Boolean).join(" ")

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
  }
  function teacherName(t: { title: { name: string }; firstName: string; lastName: string }) {
    return `${t.title.name}${t.firstName} ${t.lastName}`
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <StudentMiniCard student={student} />

      <div className="ks-card">
        <div className="ks-card-header">
          <div>
            <div className="eyebrow">S01 · STUDENT</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{fullName}</div>
          </div>
          <div className="mono" style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {student.studentCode} · {student.gradeLevel}/{student.classRoom} · เลขที่ {student.classNumber}
          </div>
        </div>
        <div className="ks-card-pad">
          <div className="divider-label" style={{ marginTop: 0 }}>ข้อมูลส่วนตัว</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <InfoRow label="เลขประจำตัวประชาชน" value={student.nationalId} mono />
            <InfoRow label="วันเกิด" value={formatDate(student.birthDate)} />
            <InfoRow label="สัญชาติ" value={student.nationality} />
            <InfoRow label="เชื้อชาติ" value={student.ethnicity} />
            <InfoRow label="ศาสนา" value={student.religion} />
            <InfoRow label="หมู่เลือด" value={student.bloodType ?? "—"} />
            {student.phone && <InfoRow label="โทรศัพท์" value={student.phone} />}
          </div>

          <div className="divider-label">ครอบครัวและครูที่ปรึกษา</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <InfoRow label="บิดา" value={father ? `${father.firstName} ${father.lastName}` : "—"} />
            <InfoRow label="มารดา" value={mother ? `${mother.firstName} ${mother.lastName}` : "—"} />
            {other && <InfoRow label={`ผู้ปกครอง (${other.relation.name})`} value={`${other.firstName} ${other.lastName}`} />}
            <InfoRow label="ครูที่ปรึกษา 1" value={advisor1 ? teacherName(advisor1) : "—"} />
            <InfoRow label="ครูที่ปรึกษา 2" value={advisor2 ? teacherName(advisor2) : "—"} />
          </div>

          <div className="divider-label">ที่อยู่</div>
          <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.6 }}>{address || "—"}</div>
        </div>
      </div>

      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          <ChevronLeft size={14} /> ย้อนกลับ
        </button>
        <div className="right">
          <button className="btn btn-primary" onClick={onNext}>
            ถัดไป — บันทึกถ้อยคำ <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Statement form ─────────────────────────────────────────────────────

type SemesterItem = { id: number; name: string; value: number }
type AcademicYearItem = { id: number; year: number }
type ViolationCategoryItem = { id: number; name: string }
type ViolationSubCategoryItem = { id: number; name: string; violationCategoryId: number }

interface Step3Props {
  student: Student
  formData: StatementFormData
  setFormData: React.Dispatch<React.SetStateAction<StatementFormData>>
  onBack: () => void
  onNext: () => void
}

function Step3Statement({ student, formData, setFormData, onBack, onNext }: Step3Props) {
  const [semesters, setSemesters] = useState<SemesterItem[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([])
  const [violationCategories, setViolationCategories] = useState<ViolationCategoryItem[]>([])
  const [violationSubCategories, setViolationSubCategories] = useState<ViolationSubCategoryItem[]>([])
  const [loadingMaster, setLoadingMaster] = useState(true)
  const [loadingSubCategories, setLoadingSubCategories] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/master/semesters").then((r) => r.json()),
      fetch("/api/master/academic-years").then((r) => r.json()),
      fetch("/api/master/violation-categories").then((r) => r.json()),
    ]).then(([sem, ay, vc]) => {
      setSemesters(sem); setAcademicYears(ay); setViolationCategories(vc)
      setLoadingMaster(false)
    })
  }, [])

  useEffect(() => {
    if (!formData.violationCategoryId) { setViolationSubCategories([]); return }
    setLoadingSubCategories(true)
    fetch(`/api/master/violation-sub-categories?categoryId=${formData.violationCategoryId}`)
      .then((r) => r.json())
      .then((data) => { setViolationSubCategories(data); setLoadingSubCategories(false) })
      .catch(() => setLoadingSubCategories(false))
  }, [formData.violationCategoryId])

  function update(fields: Partial<StatementFormData>) {
    setFormData((prev) => ({ ...prev, ...fields }))
  }

  const isValid =
    formData.semesterId && formData.academicYearId && formData.violationCategoryId &&
    formData.subject.trim() && formData.detail.trim() &&
    formData.incidentDateTime && formData.location.trim() && formData.recorder.trim()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <StudentMiniCard student={student} />

      <div className="wizard-body">
        <h2 className="step-heading">บันทึกถ้อยคำ</h2>
        <p className="step-sub">กรอกรายละเอียดการกระทำความผิด</p>

        {loadingMaster ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-3)" }}>กำลังโหลด...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FieldGroup label="ภาคเรียน" required>
                <select
                  className="ks-select"
                  value={formData.semesterId}
                  onChange={(e) => {
                    const found = semesters.find((s) => String(s.id) === e.target.value)
                    update({ semesterId: e.target.value, semesterLabel: found?.name ?? "" })
                  }}
                >
                  <option value="" disabled>เลือกภาคเรียน</option>
                  {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="ปีการศึกษา" required>
                <select
                  className="ks-select"
                  value={formData.academicYearId}
                  onChange={(e) => {
                    const found = academicYears.find((a) => String(a.id) === e.target.value)
                    update({ academicYearId: e.target.value, academicYearLabel: found ? String(found.year) : "" })
                  }}
                >
                  <option value="" disabled>เลือกปีการศึกษา</option>
                  {academicYears.map((a) => <option key={a.id} value={a.id}>{a.year}</option>)}
                </select>
              </FieldGroup>
            </div>

            <FieldGroup label="หมวดการผิดระเบียบ" required>
              <select
                className="ks-select"
                value={formData.violationCategoryId}
                onChange={(e) => {
                  const found = violationCategories.find((c) => String(c.id) === e.target.value)
                  update({ violationCategoryId: e.target.value, violationCategoryLabel: found?.name ?? "", violationSubCategoryId: "", violationSubCategoryLabel: "" })
                }}
              >
                <option value="" disabled>เลือกหมวด</option>
                {violationCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FieldGroup>

            {formData.violationCategoryId && (
              <FieldGroup label="หมวดย่อย">
                {loadingSubCategories ? (
                  <div style={{ fontSize: 13, color: "var(--ink-3)" }}>กำลังโหลด...</div>
                ) : violationSubCategories.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--ink-4)" }}>ไม่มีหมวดย่อยสำหรับหมวดนี้</div>
                ) : (
                  <select
                    className="ks-select"
                    value={formData.violationSubCategoryId}
                    onChange={(e) => {
                      const found = violationSubCategories.find((s) => String(s.id) === e.target.value)
                      update({ violationSubCategoryId: e.target.value, violationSubCategoryLabel: found?.name ?? "" })
                    }}
                  >
                    <option value="">เลือกหมวดย่อย (ถ้ามี)</option>
                    {violationSubCategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </FieldGroup>
            )}

            <FieldGroup label="เรื่อง" required>
              <textarea
                className="ks-textarea"
                value={formData.subject}
                onChange={(e) => update({ subject: e.target.value })}
                placeholder="กรอกพฤติกรรมที่กระทำความผิด"
                rows={3}
              />
            </FieldGroup>

            <FieldGroup label="รายละเอียดการผิดระเบียบ" required>
              <textarea
                className="ks-textarea"
                value={formData.detail}
                onChange={(e) => update({ detail: e.target.value })}
                placeholder="กรอกรายละเอียดการกระทำความผิด"
                rows={3}
              />
            </FieldGroup>

            <FieldGroup label="วันเวลาเกิดเหตุ" required>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input
                  className="ks-input"
                  type="date"
                  value={formData.incidentDateTime ? formData.incidentDateTime.slice(0, 10) : ""}
                  onChange={(e) => {
                    const date = e.target.value
                    const time = formData.incidentDateTime ? formData.incidentDateTime.slice(11, 16) : "00:00"
                    update({ incidentDateTime: date ? `${date}T${time}` : "" })
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <select
                    className="ks-select"
                    value={formData.incidentDateTime ? formData.incidentDateTime.slice(11, 13) : ""}
                    onChange={(e) => {
                      const hh = e.target.value
                      const date = formData.incidentDateTime ? formData.incidentDateTime.slice(0, 10) : new Date().toISOString().slice(0, 10)
                      const mm = formData.incidentDateTime ? formData.incidentDateTime.slice(14, 16) : "00"
                      update({ incidentDateTime: hh !== "" ? `${date}T${hh}:${mm}` : "" })
                    }}
                  >
                    <option value="">ชม.</option>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span style={{ color: "var(--ink-3)" }}>:</span>
                  <select
                    className="ks-select"
                    value={formData.incidentDateTime ? formData.incidentDateTime.slice(14, 16) : ""}
                    onChange={(e) => {
                      const mm = e.target.value
                      const date = formData.incidentDateTime ? formData.incidentDateTime.slice(0, 10) : new Date().toISOString().slice(0, 10)
                      const hh = formData.incidentDateTime ? formData.incidentDateTime.slice(11, 13) : "00"
                      update({ incidentDateTime: mm !== "" ? `${date}T${hh}:${mm}` : "" })
                    }}
                  >
                    <option value="">นาที</option>
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </FieldGroup>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FieldGroup label="สถานที่เกิดเหตุ" required>
                <input
                  className="ks-input"
                  type="text"
                  value={formData.location}
                  onChange={(e) => update({ location: e.target.value })}
                  placeholder="ระบุสถานที่"
                />
              </FieldGroup>
              <FieldGroup label="ผู้บันทึกข้อมูล" required>
                <input
                  className="ks-input"
                  type="text"
                  value={formData.recorder}
                  onChange={(e) => update({ recorder: e.target.value })}
                  placeholder="ชื่อผู้บันทึก"
                />
              </FieldGroup>
            </div>
          </div>
        )}

        <div className="wizard-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            <ChevronLeft size={14} /> ย้อนกลับ
          </button>
          <div className="right">
            <button className="btn btn-primary" onClick={onNext} disabled={!isValid}>
              ถัดไป — มาตรการ <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Measures ───────────────────────────────────────────────────────────

interface Step4Props {
  measureData: MeasureFormData
  setMeasureData: React.Dispatch<React.SetStateAction<MeasureFormData>>
  onBack: () => void
  onNext: () => void
}

function Step4Measures({ measureData, setMeasureData, onBack, onNext }: Step4Props) {
  const showBond = measureData.selected.includes("probation_bond")

  function toggle(id: string) {
    setMeasureData((prev) => ({
      ...prev,
      selected: prev.selected.includes(id)
        ? prev.selected.filter((m) => m !== id)
        : [...prev.selected, id],
    }))
  }

  return (
    <div className="wizard-body">
      <h2 className="step-heading">มาตรการ / การดำเนินการ</h2>
      <p className="step-sub">เลือกมาตรการที่จะดำเนินการกับนักเรียน</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <div className="divider-label" style={{ marginTop: 0 }}>ส่วนที่ 3 — การพิจารณา</div>
          <MeasureList items={CONSIDERATION_MEASURES} selected={measureData.selected} onToggle={toggle} />
        </div>
        <div>
          <div className="divider-label">ส่วนที่ 4 — ผลการพิจารณา</div>
          <MeasureList items={RESULT_MEASURES} selected={measureData.selected} onToggle={toggle} />
        </div>

        {showBond && (
          <div style={{ padding: "12px 16px", background: "var(--amber-wash, #fffbeb)", border: "1px solid var(--amber)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--amber)" }}>
            <ShieldAlert size={13} style={{ display: "inline", marginRight: 6 }} />
            เลือก <strong>ทำทัณฑ์บน</strong> — ระบบจะเพิ่มขั้นตอนกรอกสัญญาก่อนยืนยัน
          </div>
        )}

        <FieldGroup label="หมายเหตุเพิ่มเติม">
          <textarea
            className="ks-textarea"
            value={measureData.notes}
            onChange={(e) => setMeasureData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
            rows={2}
          />
        </FieldGroup>
      </div>

      <div className="wizard-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          <ChevronLeft size={14} /> ย้อนกลับ
        </button>
        <div className="right">
          <button className="btn btn-primary" onClick={onNext}>
            {showBond ? "ถัดไป — ทำทัณฑ์บน" : "ถัดไป — ลงนาม"} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function MeasureList({
  items, selected, onToggle,
}: { items: typeof CONSIDERATION_MEASURES; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((m) => {
        const checked = selected.includes(m.id)
        const isBond = m.id === "probation_bond"
        return (
          <label
            key={m.id}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderRadius: "var(--radius)",
              border: `1px solid ${checked ? (isBond ? "var(--amber)" : "var(--periwinkle)") : "var(--rule)"}`,
              background: checked ? (isBond ? "var(--amber-wash, #fffbeb)" : "var(--indigo-wash)") : "var(--surface)",
              cursor: "pointer",
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
              background: checked ? (isBond ? "var(--amber)" : "var(--indigo)") : "transparent",
              border: `2px solid ${checked ? (isBond ? "var(--amber)" : "var(--indigo)") : "var(--rule-2)"}`,
              flexShrink: 0,
            }}>
              {checked && <Check size={11} color="#fff" />}
            </div>
            <input type="checkbox" style={{ display: "none" }} checked={checked} onChange={() => onToggle(m.id)} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{m.label}</span>
            {isBond && (
              <span className="chip chip-pending" style={{ fontSize: 11 }}>+ขั้นตอน</span>
            )}
          </label>
        )
      })}
    </div>
  )
}

// ── Step 5 (Bond) ──────────────────────────────────────────────────────────────

interface Step5Props {
  student: Student
  formData: StatementFormData
  bondData: BondFormData
  setBondData: React.Dispatch<React.SetStateAction<BondFormData>>
  onBack: () => void
  onNext: () => void
}

function Step5Bond({ student, formData, bondData, setBondData, onBack, onNext }: Step5Props) {
  const selectedGuardian =
    bondData.selectedGuardianIndex !== null ? student.guardians[bondData.selectedGuardianIndex] : null
  const isValid =
    bondData.selectedGuardianIndex !== null && bondData.penaltyActions.length > 0 &&
    (!bondData.penaltyActions.includes("deduct_score") || bondData.deductPoints.trim() !== "")

  function togglePenalty(id: string) {
    setBondData((prev) => ({
      ...prev,
      penaltyActions: prev.penaltyActions.includes(id)
        ? prev.penaltyActions.filter((p) => p !== id)
        : [...prev.penaltyActions, id],
      deductPoints: id === "deduct_score" && prev.penaltyActions.includes(id) ? "" : prev.deductPoints,
    }))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <StudentMiniCard student={student} />

      <div className="wizard-body">
        <h2 className="step-heading">ทำทัณฑ์บน</h2>
        <p className="step-sub">ระบุผู้ปกครองและบทลงโทษหากทำผิดซ้ำ</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <div className="divider-label" style={{ marginTop: 0 }}>เลือกผู้ปกครองลงนาม <span style={{ color: "var(--rose)" }}>*</span></div>
            {student.guardians.length === 0 ? (
              <div style={{ fontSize: 13.5, color: "var(--ink-3)", padding: "12px 0" }}>ไม่มีข้อมูลผู้ปกครองในระบบ</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {student.guardians.map((g, idx) => {
                  const sel = bondData.selectedGuardianIndex === idx
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBondData((prev) => ({ ...prev, selectedGuardianIndex: idx }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                        borderRadius: "var(--radius)",
                        border: `2px solid ${sel ? "var(--indigo)" : "var(--rule)"}`,
                        background: sel ? "var(--indigo-wash)" : "var(--surface)",
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${sel ? "var(--indigo)" : "var(--rule-2)"}`,
                        background: sel ? "var(--indigo)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{g.firstName} {g.lastName}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{g.relation.name}{g.phone ? ` · ${g.phone}` : ""}</div>
                      </div>
                      {sel && <span className="chip chip-approved" style={{ fontSize: 11 }}>เลือกแล้ว</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedGuardian && (
            <div>
              <div className="divider-label">ข้อมูลในสัญญา</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                <InfoRow label="ผู้ปกครอง" value={`${selectedGuardian.firstName} ${selectedGuardian.lastName}`} />
                <InfoRow label="ความสัมพันธ์" value={selectedGuardian.relation.name} />
                <InfoRow label="นักเรียน" value={`${student.title.name}${student.firstName} ${student.lastName}`} />
                <InfoRow label="ชั้น / เลขที่" value={`${student.gradeLevel}/${student.classRoom} · เลขที่ ${student.classNumber}`} />
              </div>
              <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                {formData.detail || "—"}
              </div>
            </div>
          )}

          <div>
            <div className="divider-label">บทลงโทษหากทำผิดซ้ำ <span style={{ color: "var(--rose)" }}>*</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {BOND_PENALTY_OPTIONS.map((opt) => {
                const checked = bondData.penaltyActions.includes(opt.id)
                return (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      borderRadius: "var(--radius)",
                      border: `1px solid ${checked ? "var(--amber)" : "var(--rule)"}`,
                      background: checked ? "var(--amber-wash, #fffbeb)" : "var(--surface)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                      background: checked ? "var(--amber)" : "transparent",
                      border: `2px solid ${checked ? "var(--amber)" : "var(--rule-2)"}`,
                      flexShrink: 0,
                    }}>
                      {checked && <Check size={11} color="#fff" />}
                    </div>
                    <input type="checkbox" style={{ display: "none" }} checked={checked} onChange={() => togglePenalty(opt.id)} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{opt.label}</span>
                    {opt.id === "deduct_score" && checked && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="number" min={1} max={100}
                          value={bondData.deductPoints}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setBondData((prev) => ({ ...prev, deductPoints: e.target.value }))}
                          placeholder="0"
                          className="ks-input"
                          style={{ width: 64, textAlign: "center" }}
                        />
                        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>คะแนน</span>
                      </div>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          <FieldGroup label="ชื่อพยาน">
            <input
              className="ks-input"
              type="text"
              value={bondData.witnessName}
              onChange={(e) => setBondData((prev) => ({ ...prev, witnessName: e.target.value }))}
              placeholder="ชื่อ-นามสกุลพยาน (ถ้ามี)"
            />
          </FieldGroup>
        </div>

        <div className="wizard-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            <ChevronLeft size={14} /> ย้อนกลับ
          </button>
          <div className="right">
            <button className="btn btn-primary" onClick={onNext} disabled={!isValid}>
              ถัดไป — ลงนาม <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 5 (Signature) ─────────────────────────────────────────────────────────

interface Step5SignatureProps {
  student: Student
  signatureData: SignatureFormData
  setSignatureData: React.Dispatch<React.SetStateAction<SignatureFormData>>
  onBack: () => void
  onNext: () => void
}

function SigPad({
  label, value, onChange, onClear,
}: { label: string; value: string; onChange: (url: string) => void; onClear: () => void }) {
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
    const canvas = canvasRef.current!
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height)
    onClear()
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}>
        {label}
      </div>
      <div className="sig-pad" style={{ height: 160, cursor: "crosshair", border: value ? "1px solid var(--sage)" : undefined, background: value ? "var(--sage-wash, #f0fdf4)" : undefined }}>
        {value ? (
          <img src={value} alt="signature" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
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
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>ล้าง</button>
        {!value && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onChange(canvasRef.current!.toDataURL("image/png"))}>
            ยืนยันลายเซ็น
          </button>
        )}
        {value && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--sage)" }}>
            <Check size={13} /> บันทึกแล้ว
          </span>
        )}
      </div>
    </div>
  )
}

function TeacherSigSelect({
  label, role, selectedId, onSelect,
}: { label: string; role: string; selectedId: number | null; onSelect: (id: number | null) => void }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}>
        {label}
      </div>
      {loading ? (
        <div style={{ height: 42, background: "var(--paper-2)", borderRadius: "var(--radius)", animation: "pulse 1.5s infinite" }} />
      ) : teachers.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--ink-4)" }}>ไม่พบครูที่มีบทบาทนี้</div>
      ) : (
        <select
          className="ks-select"
          value={selectedId ?? ""}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null
            onSelect(id)
          }}
        >
          <option value="">เลือก{label}</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.title.name}{t.firstName} {t.lastName}</option>
          ))}
        </select>
      )}
      {selected && (
        <div className="sig-display" style={{ borderColor: selected.signatureUrl ? "var(--sage)" : undefined }}>
          {selected.signatureUrl
            ? <img src={selected.signatureUrl} alt="sig" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ยังไม่มีลายเซ็นในระบบ</span>}
          <span className="sig-name">{selected.title.name}{selected.firstName} {selected.lastName}</span>
        </div>
      )}
    </div>
  )
}

function Step5Signature({ student, signatureData, setSignatureData, onBack, onNext }: Step5SignatureProps) {
  const advisor = student.advisors.find((a) => a.slot === 1)?.teacher

  function setSig(field: keyof Pick<SignatureFormData, "studentSignature" | "guardianSignature" | "advisorSignature">, val: string) {
    setSignatureData((prev) => ({ ...prev, [field]: val }))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <StudentMiniCard student={student} />

      <div className="wizard-body">
        <h2 className="step-heading">ลงนาม</h2>
        <p className="step-sub">เซ็นชื่อในช่องที่กำหนด แล้วกด "ยืนยันลายเซ็น"</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <SigPad
            label="นักเรียน"
            value={signatureData.studentSignature}
            onChange={(v) => setSig("studentSignature", v)}
            onClear={() => setSig("studentSignature", "")}
          />
          <SigPad
            label="ผู้ปกครอง (รับทราบ)"
            value={signatureData.guardianSignature}
            onChange={(v) => setSig("guardianSignature", v)}
            onClear={() => setSig("guardianSignature", "")}
          />
          <SigPad
            label={`ครูที่ปรึกษา${advisor ? ` — ${advisor.title.name}${advisor.firstName} ${advisor.lastName}` : ""}`}
            value={signatureData.advisorSignature}
            onChange={(v) => setSig("advisorSignature", v)}
            onClear={() => setSig("advisorSignature", "")}
          />
          <TeacherSigSelect
            label="ครูฝ่ายปกครอง"
            role="ครูฝ่ายปกครอง"
            selectedId={signatureData.disciplineTeacherId}
            onSelect={(id) => setSignatureData((prev) => ({ ...prev, disciplineTeacherId: id }))}
          />
        </div>

        <div style={{ gridColumn: "1/-1", marginTop: 16 }}>
          <TeacherSigSelect
            label="หัวหน้าระดับชั้น"
            role="หัวหน้าระดับชั้น"
            selectedId={signatureData.gradeHeadTeacherId}
            onSelect={(id) => setSignatureData((prev) => ({ ...prev, gradeHeadTeacherId: id }))}
          />
        </div>

        <div className="wizard-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            <ChevronLeft size={14} /> ย้อนกลับ
          </button>
          <div className="right">
            <button className="btn btn-primary" onClick={onNext}>
              ถัดไป — ยืนยัน <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 6: Confirm & Submit ───────────────────────────────────────────────────

interface Step6Props {
  student: Student
  formData: StatementFormData
  measureData: MeasureFormData
  bondData: BondFormData
  showBondStep: boolean
  saving: boolean
  saveError: string | null
  onBack: () => void
  onSubmit: () => void
}

function Step6Confirm({ student, formData, measureData, bondData, showBondStep, saving, saveError, onBack, onSubmit }: Step6Props) {
  function formatThaiDateTime(dt: string) {
    if (!dt) return "—"
    const [datePart, timePart] = dt.split("T")
    const [year, month, day] = datePart.split("-")
    return `${Number(day)} ${THAI_MONTHS[Number(month) - 1]} ${Number(year) + 543}${timePart ? ` เวลา ${timePart} น.` : ""}`
  }

  const selectedLabels = [...CONSIDERATION_MEASURES, ...RESULT_MEASURES]
    .filter((m) => measureData.selected.includes(m.id))
    .map((m) => m.label)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <StudentMiniCard student={student} />

      <div className="ks-card">
        <div className="ks-card-header">
          <div>
            <div className="eyebrow">SUMMARY · สรุปข้อมูลก่อนบันทึก</div>
          </div>
          <span className="chip chip-pending">รออนุมัติ</span>
        </div>
        <div className="ks-card-pad">
          <div className="divider-label" style={{ marginTop: 0 }}>ถ้อยคำ</div>
          <InfoRow label="ภาคเรียน" value={formData.semesterLabel} />
          <InfoRow label="ปีการศึกษา" value={formData.academicYearLabel} />
          <InfoRow label="หมวด" value={formData.violationCategoryLabel} />
          {formData.violationSubCategoryLabel && <InfoRow label="หมวดย่อย" value={formData.violationSubCategoryLabel} />}
          <InfoRow label="วันเวลาเกิดเหตุ" value={formatThaiDateTime(formData.incidentDateTime)} />
          <InfoRow label="สถานที่" value={formData.location} />
          <InfoRow label="ผู้บันทึก" value={formData.recorder} />

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>เรื่อง</div>
            <div style={{ fontSize: 13.5, padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--radius)", lineHeight: 1.6 }}>{formData.subject}</div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>รายละเอียด</div>
            <div style={{ fontSize: 13.5, padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--radius)", lineHeight: 1.6 }}>{formData.detail}</div>
          </div>

          <div className="divider-label">มาตรการ</div>
          {selectedLabels.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {selectedLabels.map((label) => (
                <span key={label} className="measure-tag">
                  <span className="dot" /> {label}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13.5, color: "var(--ink-4)" }}>ไม่ได้เลือกมาตรการ</div>
          )}
          {measureData.notes && (
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--ink-3)", padding: "8px 12px", background: "var(--surface-2)", borderRadius: "var(--radius)" }}>{measureData.notes}</div>
          )}

          {showBondStep && (
            <>
              <div className="divider-label">ทัณฑ์บน</div>
              {bondData.selectedGuardianIndex !== null && student.guardians[bondData.selectedGuardianIndex] && (() => {
                const g = student.guardians[bondData.selectedGuardianIndex!]
                return (
                  <>
                    <InfoRow label="ผู้ปกครองลงนาม" value={`${g.firstName} ${g.lastName} (${g.relation.name})`} />
                  </>
                )
              })()}
              {bondData.penaltyActions.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {BOND_PENALTY_OPTIONS.filter((o) => bondData.penaltyActions.includes(o.id)).map((o) => (
                    <span key={o.id} className="measure-tag" style={{ background: "var(--amber-wash, #fffbeb)", color: "var(--amber)" }}>
                      <span className="dot" style={{ background: "var(--amber)" }} /> {o.label}
                      {o.id === "deduct_score" && bondData.deductPoints && ` ${bondData.deductPoints} คะแนน`}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div style={{ padding: "10px 14px", background: "var(--rose-wash, #fff0f0)", border: "1px solid var(--rose)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--rose)" }}>
          {saveError}
        </div>
      )}

      <div className="wizard-actions" style={{ background: "var(--surface)", border: "1px solid var(--rule)", borderRadius: "var(--radius-lg)", padding: "20px 24px", marginTop: 0 }}>
        <button className="btn btn-secondary" onClick={onBack} disabled={saving}>
          <ChevronLeft size={14} /> ย้อนกลับ
        </button>
        <div className="right">
          <button className="btn btn-primary" onClick={onSubmit} disabled={saving} style={{ background: "var(--sage, #059669)" }}>
            {saving ? (
              <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> กำลังบันทึก...</>
            ) : (
              <><CheckCircle2 size={14} /> ยืนยันและบันทึก</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared UI ──────────────────────────────────────────────────────────────────

function StudentMiniCard({ student }: { student: Student }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px",
      background: "var(--indigo-wash)",
      borderRadius: "var(--radius)",
      border: "1px solid var(--periwinkle)",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "var(--indigo)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <User size={15} color="#fff" />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{student.title.name}{student.firstName} {student.lastName}</div>
        <div className="mono" style={{ fontSize: 12, color: "var(--indigo-ink)" }}>
          {student.studentCode} · ชั้น {student.gradeLevel}/{student.classRoom} · เลขที่ {student.classNumber}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value${mono ? " mono" : ""}`}>{value || "—"}</span>
    </div>
  )
}

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-2)" }}>
        {label}{required && <span style={{ color: "var(--rose)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}
