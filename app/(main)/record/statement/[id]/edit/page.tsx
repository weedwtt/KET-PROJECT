"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, ChevronLeft } from "lucide-react"

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

type StatementFormData = {
  semesterId: string
  semesterLabel: string
  academicYearId: string
  academicYearLabel: string
  violationCategoryId: string
  violationCategoryLabel: string
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

// ── Step config ────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "ข้อมูลนักเรียน", desc: "ยืนยันข้อมูล" },
  { label: "บันทึกถ้อยคำ", desc: "แก้ไขรายละเอียด" },
  { label: "มาตรการ", desc: "แก้ไขการดำเนินการ" },
  { label: "ทำทัณฑ์บน", desc: "แก้ไขสัญญา" },        // index 3 — conditional
  { label: "ลงนาม", desc: "เซ็นชื่อ" },               // index 4
  { label: "ยืนยันและบันทึก", desc: "ตรวจสอบและบันทึก" }, // index 5
]

// ── Constants ──────────────────────────────────────────────────────────────────

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

const CONSIDERATION_MEASURES = [
  { id: "notify_parent", label: "แจ้งผู้ปกครอง" },
  { id: "invite_parent", label: "เชิญผู้ปกครองรับทราบพฤติกรรม" },
]

const RESULT_MEASURES = [
  { id: "verbal_warning", label: "ตักเตือน" },
  { id: "deduct_score", label: "ตัดคะแนนความประพฤติ" },
  { id: "behavior_activity", label: "ทำกิจกรรมปรับเปลี่ยนพฤติกรรม" },
  { id: "probation_bond", label: "ทำทัณฑ์บน" },
]

const BOND_PENALTY_OPTIONS = [
  { id: "deduct_score", label: "ตัดคะแนนความประพฤติ" },
  { id: "behavior_camp", label: "ทำกิจกรรมค่ายปรับพฤติกรรม" },
  { id: "suspension", label: "พักการเรียน" },
  { id: "transfer", label: "ย้ายสถานศึกษา" },
]

// ── Root page ──────────────────────────────────────────────────────────────────

export default function EditStatementPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [student, setStudent] = useState<Student | null>(null)

  const [formData, setFormData] = useState<StatementFormData>({
    semesterId: "",
    semesterLabel: "",
    academicYearId: "",
    academicYearLabel: "",
    violationCategoryId: "",
    violationCategoryLabel: "",
    subject: "",
    detail: "",
    incidentDateTime: "",
    location: "",
    recorder: "",
  })

  const [measureData, setMeasureData] = useState<MeasureFormData>({
    selected: [],
    notes: "",
  })

  const [bondData, setBondData] = useState<BondFormData>({
    selectedGuardianIndex: null,
    penaltyActions: [],
    deductPoints: "",
    witnessName: "",
  })

  const [signatureData, setSignatureData] = useState<SignatureFormData>({
    studentSignature: "",
    guardianSignature: "",
    advisorSignature: "",
    disciplineTeacherId: null,
    gradeHeadTeacherId: null,
  })

  useEffect(() => {
    fetch(`/api/statements/${id}`)
      .then((r) => r.json())
      .then((rec) => {
        if (rec.status === "approved") {
          router.replace(`/record/statement/${id}`)
          return
        }

        setStudent(rec.student)

        const incidentAt = rec.incidentAt ? new Date(rec.incidentAt) : null
        const pad = (n: number) => String(n).padStart(2, "0")
        const incidentDate = incidentAt
          ? `${incidentAt.getFullYear()}-${pad(incidentAt.getMonth() + 1)}-${pad(incidentAt.getDate())}`
          : ""
        const incidentHour = incidentAt ? pad(incidentAt.getHours()) : ""
        const incidentMinute = incidentAt ? pad(incidentAt.getMinutes()) : ""

        setFormData({
          semesterId: String(rec.semester.id),
          semesterLabel: rec.semester.name,
          academicYearId: String(rec.academicYear.id),
          academicYearLabel: String(rec.academicYear.year),
          violationCategoryId: String(rec.violationCategory.id),
          violationCategoryLabel: rec.violationCategory.name,
          subject: rec.subject,
          detail: rec.content,
          incidentDateTime: incidentDate && incidentHour ? `${incidentDate}T${incidentHour}:${incidentMinute}` : "",
          location: rec.location ?? "",
          recorder: rec.recordedBy,
        })

        const allMeasures = [
          ...(rec.considerationMeasures ?? []),
          ...(rec.resultMeasures ?? []),
        ]
        setMeasureData({ selected: allMeasures, notes: rec.measureNotes ?? "" })

        if (rec.bond) {
          const guardianIdx = rec.student.guardians.findIndex(
            (g: Guardian) => g.id === rec.bond.guardianId
          )
          setBondData({
            selectedGuardianIndex: guardianIdx >= 0 ? guardianIdx : null,
            penaltyActions: rec.bond.penaltyActions ?? [],
            deductPoints: rec.bond.deductPoints ? String(rec.bond.deductPoints) : "",
            witnessName: rec.bond.witnessName ?? "",
          })
        }

        setSignatureData({
          studentSignature: rec.studentSignature ?? "",
          guardianSignature: rec.guardianSignature ?? "",
          advisorSignature: rec.advisorSignature ?? "",
          disciplineTeacherId: rec.disciplineTeacherId ?? null,
          gradeHeadTeacherId: rec.gradeHeadTeacherId ?? null,
        })

        setLoading(false)
      })
  }, [id, router])

  const showBondStep = measureData.selected.includes("probation_bond")

  function handleNext() {
    if (step === 2 && !showBondStep) {
      setStep(4)
      return
    }
    setStep((s) => s + 1)
  }

  function handleBack() {
    if (step === 4 && !showBondStep) {
      setStep(2)
      return
    }
    setStep((s) => Math.max(0, s - 1))
  }

  async function handleSubmit() {
    if (!student) return
    setSaving(true)
    setSaveError(null)

    const bondGuardianId =
      showBondStep && bondData.selectedGuardianIndex !== null
        ? (student.guardians[bondData.selectedGuardianIndex]?.id ?? null)
        : null

    try {
      const res = await fetch(`/api/statements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterId: formData.semesterId,
          academicYearId: formData.academicYearId,
          violationCategoryId: formData.violationCategoryId,
          subject: formData.subject,
          detail: formData.detail,
          incidentDateTime: formData.incidentDateTime || null,
          location: formData.location,
          recorder: formData.recorder,
          considerationMeasures: measureData.selected.filter((mid) =>
            CONSIDERATION_MEASURES.some((m) => m.id === mid)
          ),
          resultMeasures: measureData.selected.filter((mid) =>
            RESULT_MEASURES.some((m) => m.id === mid)
          ),
          measureNotes: measureData.notes || null,
          bond:
            showBondStep && bondGuardianId
              ? {
                  guardianId: bondGuardianId,
                  penaltyActions: bondData.penaltyActions,
                  deductPoints: bondData.deductPoints ? Number(bondData.deductPoints) : null,
                  witnessName: bondData.witnessName || null,
                }
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

      router.push(`/record/statement/${id}`)
    } catch {
      setSaveError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่")
    } finally {
      setSaving(false)
    }
  }

  const displayStep = !showBondStep && step >= 4 ? step - 1 : step
  const visibleStepsList = STEPS.filter((_, i) => i !== 3 || showBondStep)

  function isActualStepComplete(actualStep: number): boolean {
    switch (actualStep) {
      case 0: return true
      case 1: return !!(
        formData.semesterId &&
        formData.academicYearId &&
        formData.violationCategoryId &&
        formData.subject &&
        formData.detail &&
        formData.incidentDateTime &&
        formData.recorder
      )
      case 2: return measureData.selected.length > 0
      case 3: return bondData.selectedGuardianIndex !== null && bondData.penaltyActions.length > 0
      case 4: return true
      case 5: return true
      default: return false
    }
  }

  const stepCompleted = visibleStepsList.map((s) => {
    const actualIdx = STEPS.indexOf(s)
    return isActualStepComplete(actualIdx)
  })

  function handleStepClick(visibleIndex: number) {
    const actualIdx = STEPS.indexOf(visibleStepsList[visibleIndex])
    setStep(actualIdx)
  }

  if (loading) {
    return (
      <div className="ks-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "var(--indigo)" }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/>
          <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="ks-page" style={{ maxWidth: 780 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href={`/record/statement/${id}`} className="btn btn-ghost btn-sm btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="page-eyebrow"><span className="num">§02</span><span>บันทึกถ้อยคำ · แก้ไข #{id}</span></div>
            <h1>แก้ไขบันทึกถ้อยคำ</h1>
          </div>
        </div>
      </div>

      <Stepper
        currentStep={displayStep}
        showBondStep={showBondStep}
        stepCompleted={stepCompleted}
        onStepClick={handleStepClick}
      />

      {step === 0 && (
        <Step1StudentInfo student={student} onNext={() => setStep(1)} />
      )}
      {step === 1 && (
        <Step2Statement
          student={student}
          formData={formData}
          setFormData={setFormData}
          onBack={() => setStep(0)}
          onNext={handleNext}
        />
      )}
      {step === 2 && (
        <Step3Measures
          measureData={measureData}
          setMeasureData={setMeasureData}
          onBack={() => setStep(1)}
          onNext={handleNext}
        />
      )}
      {step === 3 && showBondStep && (
        <Step4Bond
          student={student}
          formData={formData}
          bondData={bondData}
          setBondData={setBondData}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <Step5Signature
          student={student}
          signatureData={signatureData}
          setSignatureData={setSignatureData}
          onBack={handleBack}
          onNext={() => setStep(5)}
        />
      )}
      {step === 5 && (
        <Step6Confirm
          student={student}
          formData={formData}
          measureData={measureData}
          bondData={bondData}
          showBondStep={showBondStep}
          saving={saving}
          saveError={saveError}
          onBack={() => setStep(4)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

// ── Stepper ────────────────────────────────────────────────────────────────────

function Stepper({
  currentStep,
  showBondStep,
  stepCompleted,
  onStepClick,
}: {
  currentStep: number
  showBondStep?: boolean
  stepCompleted: boolean[]
  onStepClick: (visibleIndex: number) => void
}) {
  const visibleSteps = STEPS.filter((_, i) => i !== 3 || showBondStep)

  return (
    <div className="wizard-stepper">
      <div className="wizard-frame">
        {visibleSteps.map((s, vi) => {
          const isDone = vi !== currentStep && stepCompleted[vi]
          const isCurrent = vi === currentStep
          const state = isDone ? "complete" : isCurrent ? "current" : "disabled"
          return (
            <div
              key={vi}
              className={`wizard-step ${state}`}
              onClick={() => onStepClick(vi)}
              style={{ cursor: "pointer" }}
            >
              <div className="step-tick" />
              <div className="step-meta">
                <span className="step-num">{vi + 1}</span>
                <span>{s.desc}</span>
              </div>
              <span className="step-label">{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Shared: StudentMiniCard ────────────────────────────────────────────────────

function StudentMiniCard({ student }: { student: Student }) {
  return (
    <div className="ks-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--indigo)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.67 0 4-1.343 4-4s-1.33-4-4-4-4 1.343-4 4 1.33 4 4 4zm0 2c-2.67 0-8 1.343-8 4v2h16v-2c0-2.657-5.33-4-8-4z"/></svg>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
          {student.title.name}{student.firstName} {student.lastName}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
          รหัส {student.studentCode} · ชั้น {student.gradeLevel}/{student.classRoom} · เลขที่ {student.classNumber}
        </div>
      </div>
    </div>
  )
}

// ── Shared: FieldGroup ─────────────────────────────────────────────────────────

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)" }}>
        {label}{required && <span style={{ color: "var(--rose)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Step 1: Student info ───────────────────────────────────────────────────────

function Step1StudentInfo({ student, onNext }: { student: Student; onNext: () => void }) {
  const fullName = `${student.title.name}${student.firstName} ${student.lastName}`
  const advisor1 = student.advisors.find((a) => a.slot === 1)?.teacher
  const advisor2 = student.advisors.find((a) => a.slot === 2)?.teacher
  const father = student.guardians.find((g) => g.relation.name === "พ่อ")
  const mother = student.guardians.find((g) => g.relation.name === "แม่")
  const otherGuardian = student.guardians.find(
    (g) => g.relation.name !== "พ่อ" && g.relation.name !== "แม่"
  )
  const addressParts = [
    student.addressHouseNo && `บ้านเลขที่ ${student.addressHouseNo}`,
    student.addressMoo && `หมู่ ${student.addressMoo}`,
    student.addressVillage && `บ้าน${student.addressVillage}`,
    student.addressSoi && `ซอย${student.addressSoi}`,
    student.addressRoad && `ถนน${student.addressRoad}`,
    student.addressSubDistrict && `ต.${student.addressSubDistrict}`,
    student.addressDistrict && `อ.${student.addressDistrict}`,
    student.addressProvince && `จ.${student.addressProvince}`,
    student.addressPostalCode,
  ].filter(Boolean)

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
  }

  function teacherName(t: { title: { name: string }; firstName: string; lastName: string }) {
    return `${t.title.name}${t.firstName} ${t.lastName}`
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ks-card">
        <div className="ks-card-header">
          <span className="num">§01</span>
          <span>ข้อมูลนักเรียน</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--indigo)", fontWeight: 700 }}>
            {student.studentCode}
          </span>
        </div>
        <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 16 }}>{fullName}</div>

          <div className="divider-label">ข้อมูลส่วนตัว</div>
          <div className="info-row"><span className="info-label">เลขประจำตัวประชาชน</span><span className="info-value" style={{ fontFamily: "var(--font-mono)" }}>{student.nationalId}</span></div>
          <div className="info-row"><span className="info-label">วันเกิด</span><span className="info-value">{formatDate(student.birthDate)}</span></div>
          <div className="info-row"><span className="info-label">สัญชาติ / เชื้อชาติ</span><span className="info-value">{student.nationality} / {student.ethnicity}</span></div>
          <div className="info-row"><span className="info-label">ศาสนา</span><span className="info-value">{student.religion}</span></div>
          <div className="info-row"><span className="info-label">หมู่เลือด</span><span className="info-value">{student.bloodType ?? "—"}</span></div>
          {student.phone && <div className="info-row"><span className="info-label">เบอร์โทรศัพท์</span><span className="info-value">{student.phone}</span></div>}

          <div className="divider-label" style={{ marginTop: 12 }}>ครอบครัวและครูที่ปรึกษา</div>
          <div className="info-row"><span className="info-label">บิดาชื่อ</span><span className="info-value">{father ? `${father.firstName} ${father.lastName}` : "—"}</span></div>
          <div className="info-row"><span className="info-label">มารดาชื่อ</span><span className="info-value">{mother ? `${mother.firstName} ${mother.lastName}` : "—"}</span></div>
          {otherGuardian && (
            <div className="info-row">
              <span className="info-label">ผู้ปกครอง ({otherGuardian.relation.name})</span>
              <span className="info-value">{otherGuardian.firstName} {otherGuardian.lastName}</span>
            </div>
          )}
          <div className="info-row"><span className="info-label">ครูที่ปรึกษา (1)</span><span className="info-value">{advisor1 ? teacherName(advisor1) : "—"}</span></div>
          <div className="info-row"><span className="info-label">ครูที่ปรึกษา (2)</span><span className="info-value">{advisor2 ? teacherName(advisor2) : "—"}</span></div>

          <div className="divider-label" style={{ marginTop: 12 }}>ที่อยู่</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7 }}>
            {addressParts.length > 0 ? addressParts.join(" ") : "—"}
          </div>
        </div>
      </div>

      <div className="wizard-actions">
        <span />
        <button onClick={onNext} className="btn btn-primary">
          ถัดไป — บันทึกถ้อยคำ
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Statement form ─────────────────────────────────────────────────────

type SemesterItem = { id: number; name: string; value: number }
type AcademicYearItem = { id: number; year: number }
type ViolationCategoryItem = { id: number; name: string }

interface Step2Props {
  student: Student
  formData: StatementFormData
  setFormData: React.Dispatch<React.SetStateAction<StatementFormData>>
  onBack: () => void
  onNext: () => void
}

function Step2Statement({ student, formData, setFormData, onBack, onNext }: Step2Props) {
  const [semesters, setSemesters] = useState<SemesterItem[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([])
  const [violationCategories, setViolationCategories] = useState<ViolationCategoryItem[]>([])
  const [loadingMaster, setLoadingMaster] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/master/semesters").then((r) => r.json()),
      fetch("/api/master/academic-years").then((r) => r.json()),
      fetch("/api/master/violation-categories").then((r) => r.json()),
    ]).then(([sem, ay, vc]) => {
      setSemesters(sem)
      setAcademicYears(ay)
      setViolationCategories(vc)
      setLoadingMaster(false)
    })
  }, [])

  function update(fields: Partial<StatementFormData>) {
    setFormData((prev) => ({ ...prev, ...fields }))
  }

  const isValid =
    formData.semesterId &&
    formData.academicYearId &&
    formData.violationCategoryId &&
    formData.subject.trim() &&
    formData.detail.trim() &&
    formData.incidentDateTime &&
    formData.location.trim() &&
    formData.recorder.trim()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <StudentMiniCard student={student} />

      <div className="ks-card">
        <div className="ks-card-header">
          <span className="num">§02</span>
          <span>บันทึกถ้อยคำ</span>
        </div>
        <div className="wizard-body">
          {loadingMaster ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
              <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: "var(--indigo)" }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/>
                <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldGroup label="ภาคเรียน" required>
                  <select
                    className="ks-select"
                    value={formData.semesterId}
                    onChange={(e) => {
                      const v = e.target.value
                      const found = semesters.find((s) => String(s.id) === v)
                      update({ semesterId: v, semesterLabel: found?.name ?? "" })
                    }}
                  >
                    <option value="">เลือกภาคเรียน</option>
                    {semesters.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </select>
                </FieldGroup>
                <FieldGroup label="ปีการศึกษา" required>
                  <select
                    className="ks-select"
                    value={formData.academicYearId}
                    onChange={(e) => {
                      const v = e.target.value
                      const found = academicYears.find((a) => String(a.id) === v)
                      update({ academicYearId: v, academicYearLabel: found ? String(found.year) : "" })
                    }}
                  >
                    <option value="">เลือกปีการศึกษา</option>
                    {academicYears.map((a) => <option key={a.id} value={String(a.id)}>{a.year}</option>)}
                  </select>
                </FieldGroup>
              </div>

              <FieldGroup label="ได้ประพฤติผิดระเบียบในหมวด" required>
                <select
                  className="ks-select"
                  value={formData.violationCategoryId}
                  onChange={(e) => {
                    const v = e.target.value
                    const found = violationCategories.find((c) => String(c.id) === v)
                    update({ violationCategoryId: v, violationCategoryLabel: found?.name ?? "" })
                  }}
                >
                  <option value="">เลือกหมวด</option>
                  {violationCategories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              </FieldGroup>

              <FieldGroup label="เรื่อง" required>
                <textarea
                  className="ks-textarea"
                  value={formData.subject}
                  onChange={(e) => update({ subject: e.target.value })}
                  placeholder="กรอกพฤติกรรมที่กระทำความผิด"
                  rows={3}
                />
              </FieldGroup>

              <FieldGroup label="ซึ่งมีรายละเอียดการผิดระเบียบ คือ" required>
                <textarea
                  className="ks-textarea"
                  value={formData.detail}
                  onChange={(e) => update({ detail: e.target.value })}
                  placeholder="กรอกรายละเอียดการกระทำความผิด"
                  rows={3}
                />
              </FieldGroup>

              <FieldGroup label="เหตุเกิดเมื่อวันที่และเวลา" required>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="date"
                    className="ks-input"
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
                      style={{ flex: 1 }}
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
                    <span style={{ color: "var(--ink-4)", fontWeight: 600 }}>:</span>
                    <select
                      className="ks-select"
                      style={{ flex: 1 }}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FieldGroup label="สถานที่เกิดเหตุ" required>
                  <input
                    type="text"
                    className="ks-input"
                    value={formData.location}
                    onChange={(e) => update({ location: e.target.value })}
                    placeholder="ระบุสถานที่"
                  />
                </FieldGroup>
                <FieldGroup label="ผู้บันทึกข้อมูล" required>
                  <input
                    type="text"
                    className="ks-input"
                    value={formData.recorder}
                    onChange={(e) => update({ recorder: e.target.value })}
                    placeholder="ชื่อผู้บันทึก"
                  />
                </FieldGroup>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="wizard-actions">
        <button onClick={onBack} className="btn btn-ghost">
          <ChevronLeft size={15} />
          ย้อนกลับ
        </button>
        <button onClick={onNext} disabled={!isValid} className="btn btn-primary">
          ถัดไป — มาตรการ
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Measures ───────────────────────────────────────────────────────────

interface Step3Props {
  measureData: MeasureFormData
  setMeasureData: React.Dispatch<React.SetStateAction<MeasureFormData>>
  onBack: () => void
  onNext: () => void
}

function Step3Measures({ measureData, setMeasureData, onBack, onNext }: Step3Props) {
  const showBond = measureData.selected.includes("probation_bond")

  function toggleMeasure(mid: string) {
    setMeasureData((prev) => ({
      ...prev,
      selected: prev.selected.includes(mid)
        ? prev.selected.filter((m) => m !== mid)
        : [...prev.selected, mid],
    }))
  }

  function MeasureList({ items }: { items: typeof CONSIDERATION_MEASURES }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((m) => {
          const checked = measureData.selected.includes(m.id)
          const isBond = m.id === "probation_bond"
          return (
            <label
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 8,
                border: `1.5px solid ${checked ? (isBond ? "var(--amber)" : "var(--periwinkle)") : "var(--rule-soft)"}`,
                background: checked ? (isBond ? "color-mix(in srgb, var(--amber) 8%, white)" : "var(--indigo-wash)") : "transparent",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: `2px solid ${checked ? (isBond ? "var(--amber)" : "var(--indigo)") : "var(--rule)"}`,
                background: checked ? (isBond ? "var(--amber)" : "var(--indigo)") : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <input type="checkbox" style={{ display: "none" }} checked={checked} onChange={() => toggleMeasure(m.id)} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)", flex: 1 }}>{m.label}</span>
              {isBond && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--amber)", background: "color-mix(in srgb, var(--amber) 12%, white)", padding: "2px 8px", borderRadius: 99 }}>
                  เพิ่มขั้นตอน
                </span>
              )}
            </label>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="ks-card">
        <div className="ks-card-header">
          <span className="num">§03</span>
          <span>มาตรการ / การดำเนินการ</span>
        </div>
        <div className="wizard-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--indigo)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>ส่วนที่ 3: การพิจารณา</div>
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 10 }}>เลือกได้มากกว่า 1 ข้อ</div>
            <MeasureList items={CONSIDERATION_MEASURES} />
          </div>

          <div style={{ borderTop: "1px solid var(--rule-soft)" }} />

          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--indigo)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>ส่วนที่ 4: ผลการพิจารณา</div>
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 10 }}>เลือกได้มากกว่า 1 ข้อ</div>
            <MeasureList items={RESULT_MEASURES} />
          </div>

          {showBond && (
            <div style={{ display: "flex", gap: 8, background: "color-mix(in srgb, var(--amber) 8%, white)", border: "1px solid color-mix(in srgb, var(--amber) 30%, white)", borderRadius: 8, padding: "10px 14px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              <p style={{ fontSize: 12, color: "color-mix(in srgb, var(--amber) 80%, black)" }}>
                เลือก <strong>ทำทัณฑ์บน</strong> — ระบบจะเพิ่มขั้นตอนกรอกสัญญาทัณฑ์บนก่อนยืนยัน
              </p>
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
      </div>

      <div className="wizard-actions">
        <button onClick={onBack} className="btn btn-ghost">
          <ChevronLeft size={15} />
          ย้อนกลับ
        </button>
        <button onClick={onNext} className="btn btn-primary">
          {showBond ? "ถัดไป — ทำทัณฑ์บน" : "ถัดไป — ลงนาม"}
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Bond (conditional) ─────────────────────────────────────────────────

interface Step4Props {
  student: Student
  formData: StatementFormData
  bondData: BondFormData
  setBondData: React.Dispatch<React.SetStateAction<BondFormData>>
  onBack: () => void
  onNext: () => void
}

function Step4Bond({ student, formData, bondData, setBondData, onBack, onNext }: Step4Props) {
  const selectedGuardian =
    bondData.selectedGuardianIndex !== null ? student.guardians[bondData.selectedGuardianIndex] : null

  const isValid =
    bondData.selectedGuardianIndex !== null &&
    bondData.penaltyActions.length > 0 &&
    (!bondData.penaltyActions.includes("deduct_score") || bondData.deductPoints.trim() !== "")

  function togglePenalty(pid: string) {
    setBondData((prev) => ({
      ...prev,
      penaltyActions: prev.penaltyActions.includes(pid)
        ? prev.penaltyActions.filter((p) => p !== pid)
        : [...prev.penaltyActions, pid],
      deductPoints: pid === "deduct_score" && prev.penaltyActions.includes(pid) ? "" : prev.deductPoints,
    }))
  }

  const studentFullName = `${student.title.name}${student.firstName} ${student.lastName}`

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <StudentMiniCard student={student} />

      {/* Guardian selection */}
      <div className="ks-card">
        <div className="ks-card-header">
          <span className="num">§05a</span>
          <span>เลือกผู้ปกครองลงนาม</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--rose)", fontWeight: 600 }}>* จำเป็น</span>
        </div>
        <div className="wizard-body">
          {student.guardians.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-4)", textAlign: "center", padding: "12px 0" }}>ไม่มีข้อมูลผู้ปกครองในระบบ</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {student.guardians.map((g, idx) => {
                const sel = bondData.selectedGuardianIndex === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBondData((prev) => ({ ...prev, selectedGuardianIndex: idx }))}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "12px 14px", borderRadius: 8, textAlign: "left",
                      border: `2px solid ${sel ? "var(--amber)" : "var(--rule-soft)"}`,
                      background: sel ? "color-mix(in srgb, var(--amber) 8%, white)" : "transparent",
                      cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <div style={{
                      marginTop: 2, width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${sel ? "var(--amber)" : "var(--rule)"}`,
                      background: sel ? "var(--amber)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{g.firstName} {g.lastName}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>
                        {g.relation.name}{g.phone ? ` · ${g.phone}` : ""}
                      </div>
                    </div>
                    {sel && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--amber)", background: "color-mix(in srgb, var(--amber) 12%, white)", padding: "2px 8px", borderRadius: 99, flexShrink: 0 }}>
                        เลือกแล้ว
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bond info summary */}
      <div className="ks-card">
        <div className="ks-card-header">
          <span className="num">§05b</span>
          <span>ข้อมูลในสัญญาทัณฑ์บน</span>
        </div>
        <div className="ks-card-pad">
          <div className="info-row"><span className="info-label">ผู้ปกครอง</span><span className="info-value">{selectedGuardian ? `${selectedGuardian.firstName} ${selectedGuardian.lastName}` : "—"}</span></div>
          <div className="info-row"><span className="info-label">ความสัมพันธ์</span><span className="info-value">{selectedGuardian?.relation.name ?? "—"}</span></div>
          <div className="info-row"><span className="info-label">เบอร์โทรผู้ปกครอง</span><span className="info-value">{selectedGuardian?.phone ?? "—"}</span></div>
          <div className="info-row"><span className="info-label">นักเรียน</span><span className="info-value">{studentFullName}</span></div>
          <div className="info-row"><span className="info-label">ชั้น / เลขประจำตัว</span><span className="info-value">{student.gradeLevel}/{student.classRoom} · {student.studentCode}</span></div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 4 }}>รายละเอียดความผิด</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", background: "color-mix(in srgb, var(--amber) 6%, white)", borderRadius: 6, padding: "8px 12px", lineHeight: 1.6 }}>
              {formData.detail || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Penalty actions */}
      <div className="ks-card">
        <div className="ks-card-header">
          <span className="num">§05c</span>
          <span>บทลงโทษหากทำผิดซ้ำ</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--rose)", fontWeight: 600 }}>* เลือกอย่างน้อย 1 ข้อ</span>
        </div>
        <div className="wizard-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {BOND_PENALTY_OPTIONS.map((opt) => {
              const checked = bondData.penaltyActions.includes(opt.id)
              return (
                <label
                  key={opt.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                    border: `1.5px solid ${checked ? "var(--amber)" : "var(--rule-soft)"}`,
                    background: checked ? "color-mix(in srgb, var(--amber) 8%, white)" : "transparent",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${checked ? "var(--amber)" : "var(--rule)"}`,
                    background: checked ? "var(--amber)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <input type="checkbox" style={{ display: "none" }} checked={checked} onChange={() => togglePenalty(opt.id)} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)", flex: 1 }}>{opt.label}</span>
                  {opt.id === "deduct_score" && checked && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                      <input
                        type="number" min={1} max={100}
                        value={bondData.deductPoints}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setBondData((prev) => ({ ...prev, deductPoints: e.target.value }))}
                        placeholder="0"
                        className="ks-input"
                        style={{ width: 64, textAlign: "center" }}
                      />
                      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>คะแนน</span>
                    </div>
                  )}
                </label>
              )
            })}
          </div>

          <FieldGroup label="ชื่อพยาน">
            <input
              type="text"
              className="ks-input"
              value={bondData.witnessName}
              onChange={(e) => setBondData((prev) => ({ ...prev, witnessName: e.target.value }))}
              placeholder="ชื่อ-นามสกุลพยาน (ถ้ามี)"
            />
          </FieldGroup>
        </div>
      </div>

      <div className="wizard-actions">
        <button onClick={onBack} className="btn btn-ghost">
          <ChevronLeft size={15} />
          ย้อนกลับ
        </button>
        <button onClick={onNext} disabled={!isValid} className="btn btn-primary">
          ถัดไป — ลงนาม
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ── Step 5: Signatures ─────────────────────────────────────────────────────────

interface Step5Props {
  student: Student
  signatureData: SignatureFormData
  setSignatureData: React.Dispatch<React.SetStateAction<SignatureFormData>>
  onBack: () => void
  onNext: () => void
}

function SigPad({
  label,
  value,
  onChange,
  onClear,
}: {
  label: string
  value: string
  onChange: (dataUrl: string) => void
  onClear: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  function getXY(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
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

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current!.getContext("2d")!
    const { x, y } = getXY(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "var(--ink)"
    const { x, y } = getXY(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function stopDraw() { drawing.current = false }

  function clear() {
    canvasRef.current!.getContext("2d")!.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    onClear()
  }

  function confirm() {
    onChange(canvasRef.current!.toDataURL("image/png"))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        className="sig-pad"
        style={{
          borderColor: value ? "var(--sage)" : undefined,
          background: value ? "color-mix(in srgb, var(--sage) 6%, white)" : undefined,
          position: "relative",
          height: 160,
        }}
      >
        {value ? (
          <img src={value} alt="signature" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={600}
              height={160}
              style={{ width: "100%", height: "100%", cursor: "crosshair", touchAction: "none", display: "block" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--ink-4)", pointerEvents: "none", userSelect: "none" }}>
              เซ็นชื่อในช่องนี้
            </span>
          </>
        )}
      </div>
      <div className="sig-label">{label}</div>
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" onClick={clear} className="btn btn-ghost btn-sm">ล้าง</button>
        {!value && (
          <button type="button" onClick={confirm} className="btn btn-primary btn-sm">ยืนยัน</button>
        )}
        {value && (
          <span style={{ fontSize: 11.5, color: "var(--sage)", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            บันทึกแล้ว
          </span>
        )}
      </div>
    </div>
  )
}

function TeacherSigSelect({
  label,
  role,
  selectedId,
  onSelect,
}: {
  label: string
  role: string
  selectedId: number | null
  onSelect: (id: number | null) => void
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {loading ? (
        <div style={{ height: 36, borderRadius: 8, background: "var(--surface-2)" }} />
      ) : teachers.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--ink-4)", fontStyle: "italic" }}>ไม่พบครูที่มีบทบาทนี้ในระบบ</p>
      ) : (
        <select
          className="ks-select"
          value={selectedId ?? ""}
          onChange={(e) => {
            const tid = e.target.value ? Number(e.target.value) : null
            onSelect(tid)
          }}
        >
          <option value="">เลือก{label}</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title.name}{t.firstName} {t.lastName}
            </option>
          ))}
        </select>
      )}
      {selected && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            className="sig-display"
            style={{ borderColor: selected.signatureUrl ? "var(--sage)" : undefined }}
          >
            {selected.signatureUrl ? (
              <img src={selected.signatureUrl} alt="signature" style={{ maxHeight: 64, objectFit: "contain" }} />
            ) : (
              <span>ยังไม่มีลายเซ็น</span>
            )}
          </div>
          <div className="sig-name">
            {selected.title.name}{selected.firstName} {selected.lastName} (อัตโนมัติ)
          </div>
        </div>
      )}
    </div>
  )
}

function Step5Signature({ student, signatureData, setSignatureData, onBack, onNext }: Step5Props) {
  const advisor = student.advisors.find((a) => a.slot === 1)?.teacher

  function setSig(field: keyof Pick<SignatureFormData, "studentSignature" | "guardianSignature" | "advisorSignature">, val: string) {
    setSignatureData((prev) => ({ ...prev, [field]: val }))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <StudentMiniCard student={student} />

      <div className="ks-card">
        <div className="ks-card-header">
          <span className="num">§04</span>
          <span>ส่วนที่ 5: ลงนาม</span>
        </div>
        <div className="wizard-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <SigPad
              label="นักเรียน"
              value={signatureData.studentSignature}
              onChange={(v) => setSig("studentSignature", v)}
              onClear={() => setSig("studentSignature", "")}
            />
            <SigPad
              label="ผู้ปกครอง (รับทราบจากครูที่ปรึกษา)"
              value={signatureData.guardianSignature}
              onChange={(v) => setSig("guardianSignature", v)}
              onClear={() => setSig("guardianSignature", "")}
            />
          </div>

          <div style={{ borderTop: "1px solid var(--rule-soft)" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <SigPad
              label={`ครูที่ปรึกษา${advisor ? ` (${advisor.title.name}${advisor.firstName} ${advisor.lastName})` : ""}`}
              value={signatureData.advisorSignature}
              onChange={(v) => setSig("advisorSignature", v)}
              onClear={() => setSig("advisorSignature", "")}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)" }}>ครูฝ่ายปกครอง</div>
              <TeacherSigSelect
                label="ครูฝ่ายปกครอง"
                role="ครูฝ่ายปกครอง"
                selectedId={signatureData.disciplineTeacherId}
                onSelect={(tid) => setSignatureData((prev) => ({ ...prev, disciplineTeacherId: tid }))}
              />
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--rule-soft)" }} />

          <div style={{ maxWidth: 300 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)", marginBottom: 6 }}>หัวหน้าระดับชั้น</div>
            <TeacherSigSelect
              label="หัวหน้าระดับชั้น"
              role="หัวหน้าระดับชั้น"
              selectedId={signatureData.gradeHeadTeacherId}
              onSelect={(tid) => setSignatureData((prev) => ({ ...prev, gradeHeadTeacherId: tid }))}
            />
          </div>
        </div>
      </div>

      <div className="wizard-actions">
        <button onClick={onBack} className="btn btn-ghost">
          <ChevronLeft size={15} />
          ย้อนกลับ
        </button>
        <button onClick={onNext} className="btn btn-primary">
          ถัดไป — ยืนยัน
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ── Step 6: Confirm & Save ─────────────────────────────────────────────────────

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
    const monthName = THAI_MONTHS[Number(month) - 1]
    const beYear = Number(year) + 543
    return `${Number(day)} ${monthName} ${beYear}${timePart ? ` เวลา ${timePart} น.` : ""}`
  }

  const allMeasures = [...CONSIDERATION_MEASURES, ...RESULT_MEASURES]
  const selectedMeasures = allMeasures.filter((m) => measureData.selected.includes(m.id))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <StudentMiniCard student={student} />

      <div className="ks-card">
        <div className="ks-card-header">
          <span className="num">§06</span>
          <span>สรุปข้อมูลก่อนบันทึก</span>
        </div>
        <div className="ks-card-pad">
          <div className="divider-label">ถ้อยคำ</div>
          <div className="info-row"><span className="info-label">ภาคเรียน / ปีการศึกษา</span><span className="info-value">{formData.semesterLabel} / {formData.academicYearLabel}</span></div>
          <div className="info-row"><span className="info-label">หมวดการผิดระเบียบ</span><span className="info-value">{formData.violationCategoryLabel}</span></div>
          <div className="info-row"><span className="info-label">วันที่เกิดเหตุ</span><span className="info-value">{formatThaiDateTime(formData.incidentDateTime)}</span></div>
          <div className="info-row"><span className="info-label">สถานที่</span><span className="info-value">{formData.location}</span></div>
          <div className="info-row"><span className="info-label">ผู้บันทึก</span><span className="info-value">{formData.recorder}</span></div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 4 }}>เรื่อง</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", background: "var(--surface-2)", borderRadius: 6, padding: "8px 12px", lineHeight: 1.6 }}>{formData.subject}</div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 4 }}>รายละเอียด</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", background: "var(--surface-2)", borderRadius: 6, padding: "8px 12px", lineHeight: 1.6 }}>{formData.detail}</div>
          </div>

          <div className="divider-label" style={{ marginTop: 16 }}>มาตรการ</div>
          {selectedMeasures.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {selectedMeasures.map((m) => (
                <span key={m.id} className="measure-tag">{m.label}</span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--ink-4)", fontStyle: "italic" }}>ไม่ได้เลือกมาตรการ</div>
          )}
          {measureData.notes && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)", background: "var(--surface-2)", borderRadius: 6, padding: "6px 10px" }}>{measureData.notes}</div>
          )}

          {showBondStep && (
            <>
              <div className="divider-label" style={{ marginTop: 16 }}>ทัณฑ์บน</div>
              {bondData.selectedGuardianIndex !== null && student.guardians[bondData.selectedGuardianIndex] && (() => {
                const g = student.guardians[bondData.selectedGuardianIndex!]
                return (
                  <>
                    <div className="info-row"><span className="info-label">ผู้ปกครองลงนาม</span><span className="info-value">{g.firstName} {g.lastName}</span></div>
                    <div className="info-row"><span className="info-label">ความสัมพันธ์</span><span className="info-value">{g.relation.name}</span></div>
                  </>
                )
              })()}
              {bondData.penaltyActions.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 4 }}>บทลงโทษหากทำผิดซ้ำ</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {BOND_PENALTY_OPTIONS.filter((o) => bondData.penaltyActions.includes(o.id)).map((o) => (
                      <span key={o.id} className="measure-tag" style={{ borderColor: "var(--amber)", color: "var(--amber)" }}>
                        {o.label}{o.id === "deduct_score" && bondData.deductPoints ? ` ${bondData.deductPoints} คะแนน` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {bondData.witnessName && <div className="info-row" style={{ marginTop: 8 }}><span className="info-label">พยาน</span><span className="info-value">{bondData.witnessName}</span></div>}
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div style={{ display: "flex", gap: 8, background: "color-mix(in srgb, var(--rose) 8%, white)", border: "1px solid color-mix(in srgb, var(--rose) 25%, white)", borderRadius: 8, padding: "10px 14px" }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--rose)" style={{ flexShrink: 0, marginTop: 1 }}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
          <span style={{ fontSize: 13, color: "var(--rose)" }}>{saveError}</span>
        </div>
      )}

      <div className="wizard-actions">
        <button onClick={onBack} disabled={saving} className="btn btn-ghost">
          <ChevronLeft size={15} />
          ย้อนกลับ
        </button>
        <button
          onClick={onSubmit}
          disabled={saving}
          className="btn btn-primary"
          style={{ background: "var(--sage)", borderColor: "var(--sage)" }}
        >
          {saving ? (
            <>
              <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/>
                <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              กำลังบันทึก...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              บันทึกการแก้ไข
            </>
          )}
        </button>
      </div>
    </div>
  )
}
