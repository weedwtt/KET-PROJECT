"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronRight,
  ChevronLeft,
  User,
  Users,
  MapPin,
  Check,
  FileText,
  ShieldAlert,
  ScrollText,
  CheckCircle2,
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
    // step 2 (measures) → skip bond (3) if not selected, go to signatures (4)
    if (step === 2 && !showBondStep) {
      setStep(4)
      return
    }
    setStep((s) => s + 1)
  }

  function handleBack() {
    // from signatures (4) → back to bond (3) if shown, else measures (2)
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

  // Bond step (3) is hidden → logical steps 4 and 5 display as 3 and 4
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
      <div className="p-6 flex justify-center items-center min-h-[300px]">
        <svg className="w-6 h-6 animate-spin text-[#465fff]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/record/statement/${id}`}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#1c2434]">แก้ไขบันทึกถ้อยคำ</h1>
          <p className="text-sm text-gray-400 mt-0.5">#{id}</p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper
        currentStep={displayStep}
        showBondStep={showBondStep}
        stepCompleted={stepCompleted}
        onStepClick={handleStepClick}
      />

      {/* Step panels */}
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

// ── Stepper indicator ──────────────────────────────────────────────────────────

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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-5">
      <div className="flex items-start">
        {visibleSteps.map((s, vi) => {
          const isActive = vi === currentStep
          const isDone = !isActive && stepCompleted[vi]
          return (
            <div key={vi} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStepClick(vi)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-[#465fff] text-white ring-4 ring-[#465fff]/20"
                      : isDone
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : vi + 1}
                </button>
                <div className="mt-2 text-center w-[60px]">
                  <p
                    className={`text-[10px] font-semibold leading-tight ${
                      isActive ? "text-[#465fff]" : isDone ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </p>
                </div>
              </div>
              {vi < visibleSteps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1.5 mt-3.5 transition-colors duration-300 ${
                    stepCompleted[vi] ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 1: Student info (read-only confirm) ───────────────────────────────────

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
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-[#465fff]/20 px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#465fff] flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg truncate">{fullName}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs bg-[#eff2ff] text-[#3a4fd4] font-semibold px-2.5 py-0.5 rounded-full">
                รหัส {student.studentCode}
              </span>
              <span className="text-xs text-gray-500">
                ชั้น {student.gradeLevel}/{student.classRoom} · เลขที่ {student.classNumber}
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          <section className="px-6 py-5">
            <SectionTitle icon={<User className="w-3.5 h-3.5" />} label="ข้อมูลส่วนตัว" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
              <Field label="เลขประจำตัวประชาชน" value={student.nationalId} mono />
              <Field label="วันเกิด" value={formatDate(student.birthDate)} />
              <Field label="สัญชาติ" value={student.nationality} />
              <Field label="เชื้อชาติ" value={student.ethnicity} />
              <Field label="ศาสนา" value={student.religion} />
              <Field label="หมู่เลือด" value={student.bloodType ?? "-"} />
              {student.phone && <Field label="เบอร์โทรศัพท์" value={student.phone} />}
            </div>
          </section>

          <section className="px-6 py-5">
            <SectionTitle icon={<Users className="w-3.5 h-3.5" />} label="ครอบครัวและครูที่ปรึกษา" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
              <Field label="บิดาชื่อ" value={father ? `${father.firstName} ${father.lastName}` : "-"} />
              <Field label="มารดาชื่อ" value={mother ? `${mother.firstName} ${mother.lastName}` : "-"} />
              {otherGuardian && (
                <Field
                  label={`ผู้ปกครอง (${otherGuardian.relation.name})`}
                  value={`${otherGuardian.firstName} ${otherGuardian.lastName}`}
                />
              )}
              <Field label="ครูที่ปรึกษา (1)" value={advisor1 ? teacherName(advisor1) : "-"} />
              <Field label="ครูที่ปรึกษา (2)" value={advisor2 ? teacherName(advisor2) : "-"} />
            </div>
          </section>

          <section className="px-6 py-5">
            <SectionTitle icon={<MapPin className="w-3.5 h-3.5" />} label="ที่อยู่" />
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              {addressParts.length > 0 ? addressParts.join(" ") : "-"}
            </p>
          </section>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#465fff] hover:bg-[#3a4fd4] active:bg-[#2d3fc7] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          ถัดไป — บันทึกถ้อยคำ
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Statement form (pre-filled) ───────────────────────────────────────

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
    <div className="space-y-4">
      <StudentMiniCard student={student} />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-[#465fff]/20 px-6 py-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#465fff]" />
          <h2 className="text-sm font-bold text-[#1c2434]">บันทึกถ้อยคำ</h2>
        </div>

        <div className="px-6 py-5 space-y-5">
          {loadingMaster ? (
            <div className="flex justify-center py-6">
              <svg className="w-5 h-5 animate-spin text-[#465fff]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="ภาคเรียน" required>
                  <NativeSelect
                    value={formData.semesterId}
                    onChange={(v) => {
                      const found = semesters.find((s) => String(s.id) === v)
                      update({ semesterId: v, semesterLabel: found?.name ?? "" })
                    }}
                    placeholder="เลือกภาคเรียน"
                    options={semesters.map((s) => ({ value: String(s.id), label: s.name }))}
                  />
                </FormGroup>
                <FormGroup label="ปีการศึกษา" required>
                  <NativeSelect
                    value={formData.academicYearId}
                    onChange={(v) => {
                      const found = academicYears.find((a) => String(a.id) === v)
                      update({ academicYearId: v, academicYearLabel: found ? String(found.year) : "" })
                    }}
                    placeholder="เลือกปีการศึกษา"
                    options={academicYears.map((a) => ({ value: String(a.id), label: String(a.year) }))}
                  />
                </FormGroup>
              </div>

              <FormGroup label="ได้ประพฤติผิดระเบียบในหมวด" required>
                <NativeSelect
                  value={formData.violationCategoryId}
                  onChange={(v) => {
                    const found = violationCategories.find((c) => String(c.id) === v)
                    update({ violationCategoryId: v, violationCategoryLabel: found?.name ?? "" })
                  }}
                  placeholder="เลือกหมวด"
                  options={violationCategories.map((c) => ({ value: String(c.id), label: c.name }))}
                />
              </FormGroup>

              <FormGroup label="เรื่อง" required>
                <textarea
                  value={formData.subject}
                  onChange={(e) => update({ subject: e.target.value })}
                  placeholder="กรอกพฤติกรรมที่กระทำความผิด"
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] placeholder:text-gray-300"
                />
              </FormGroup>

              <FormGroup label="ซึ่งมีรายละเอียดการผิดระเบียบ คือ" required>
                <textarea
                  value={formData.detail}
                  onChange={(e) => update({ detail: e.target.value })}
                  placeholder="กรอกรายละเอียดการกระทำความผิด"
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] placeholder:text-gray-300"
                />
              </FormGroup>

              <FormGroup label="เหตุเกิดเมื่อวันที่และเวลา" required>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.incidentDateTime ? formData.incidentDateTime.slice(0, 10) : ""}
                    onChange={(e) => {
                      const date = e.target.value
                      const time = formData.incidentDateTime ? formData.incidentDateTime.slice(11, 16) : "00:00"
                      update({ incidentDateTime: date ? `${date}T${time}` : "" })
                    }}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] text-gray-800"
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      value={formData.incidentDateTime ? formData.incidentDateTime.slice(11, 13) : ""}
                      onChange={(e) => {
                        const hh = e.target.value
                        const date = formData.incidentDateTime ? formData.incidentDateTime.slice(0, 10) : new Date().toISOString().slice(0, 10)
                        const mm = formData.incidentDateTime ? formData.incidentDateTime.slice(14, 16) : "00"
                        update({ incidentDateTime: hh !== "" ? `${date}T${hh}:${mm}` : "" })
                      }}
                      className="flex-1 px-2 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] text-gray-800 bg-white"
                    >
                      <option value="">ชม.</option>
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="text-gray-400 text-sm font-medium">:</span>
                    <select
                      value={formData.incidentDateTime ? formData.incidentDateTime.slice(14, 16) : ""}
                      onChange={(e) => {
                        const mm = e.target.value
                        const date = formData.incidentDateTime ? formData.incidentDateTime.slice(0, 10) : new Date().toISOString().slice(0, 10)
                        const hh = formData.incidentDateTime ? formData.incidentDateTime.slice(11, 13) : "00"
                        update({ incidentDateTime: mm !== "" ? `${date}T${hh}:${mm}` : "" })
                      }}
                      className="flex-1 px-2 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] text-gray-800 bg-white"
                    >
                      <option value="">นาที</option>
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </FormGroup>

              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="สถานที่เกิดเหตุ" required>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => update({ location: e.target.value })}
                    placeholder="ระบุสถานที่"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] placeholder:text-gray-300"
                  />
                </FormGroup>
                <FormGroup label="ผู้บันทึกข้อมูล" required>
                  <input
                    type="text"
                    value={formData.recorder}
                    onChange={(e) => update({ recorder: e.target.value })}
                    placeholder="ชื่อผู้บันทึก"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] placeholder:text-gray-300"
                  />
                </FormGroup>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#465fff] hover:bg-[#3a4fd4] active:bg-[#2d3fc7] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          ถัดไป — มาตรการ
          <ChevronRight className="w-4 h-4" />
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
      <div className="space-y-2">
        {items.map((m) => {
          const checked = measureData.selected.includes(m.id)
          const isBond = m.id === "probation_bond"
          return (
            <label
              key={m.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                checked
                  ? isBond
                    ? "border-orange-300 bg-orange-50"
                    : "border-[#465fff]/20 bg-[#eff2ff]"
                  : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                  checked
                    ? isBond
                      ? "bg-orange-500 border-orange-500"
                      : "bg-[#465fff] border-[#465fff]"
                    : "border-gray-300"
                }`}
              >
                {checked && <Check className="w-3 h-3 text-white" />}
              </div>
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleMeasure(m.id)} />
              <span className={`text-sm font-medium ${checked ? "text-gray-800" : "text-gray-600"}`}>
                {m.label}
              </span>
              {isBond && (
                <span className="ml-auto text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
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
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-[#465fff]/20 px-6 py-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#465fff]" />
          <h2 className="text-sm font-bold text-[#1c2434]">มาตรการ / การดำเนินการ</h2>
        </div>
        <div className="px-6 py-5 space-y-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-[#465fff]">ส่วนที่ 3: การพิจารณา</p>
              <p className="text-xs text-gray-400 mt-0.5">เลือกได้มากกว่า 1 ข้อ</p>
            </div>
            <MeasureList items={CONSIDERATION_MEASURES} />
          </div>

          <div className="border-t border-gray-100" />

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-[#465fff]">ส่วนที่ 4: ผลการพิจารณา</p>
              <p className="text-xs text-gray-400 mt-0.5">เลือกได้มากกว่า 1 ข้อ</p>
            </div>
            <MeasureList items={RESULT_MEASURES} />
          </div>

          {showBond && (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
              <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                เลือก <strong>ทำทัณฑ์บน</strong> — ระบบจะเพิ่มขั้นตอนกรอกสัญญาทัณฑ์บนก่อนยืนยัน
              </p>
            </div>
          )}

          <div>
            <FormGroup label="หมายเหตุเพิ่มเติม">
              <textarea
                value={measureData.notes}
                onChange={(e) => setMeasureData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
                rows={2}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] placeholder:text-gray-300"
              />
            </FormGroup>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#465fff] hover:bg-[#3a4fd4] active:bg-[#2d3fc7] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {showBond ? "ถัดไป — ทำทัณฑ์บน" : "ถัดไป — ลงนาม"}
          <ChevronRight className="w-4 h-4" />
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
    <div className="space-y-4">
      <StudentMiniCard student={student} />

      {/* Guardian selection */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 px-6 py-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold text-[#1c2434]">เลือกผู้ปกครองลงนาม</h2>
          <span className="ml-auto text-xs text-red-500 font-medium">* จำเป็น</span>
        </div>
        <div className="px-6 py-5">
          {student.guardians.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">ไม่มีข้อมูลผู้ปกครองในระบบ</p>
          ) : (
            <div className="space-y-2">
              {student.guardians.map((g, idx) => {
                const sel = bondData.selectedGuardianIndex === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBondData((prev) => ({ ...prev, selectedGuardianIndex: idx }))}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-lg border-2 text-left transition-all ${
                      sel ? "border-orange-400 bg-orange-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                        sel ? "border-orange-400 bg-orange-400" : "border-gray-300"
                      }`}
                    >
                      {sel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{g.firstName} {g.lastName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {g.relation.name}{g.phone ? ` · ${g.phone}` : ""}
                      </p>
                    </div>
                    {sel && (
                      <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full shrink-0">
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 px-6 py-4 flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold text-[#1c2434]">ข้อมูลในสัญญาทัณฑ์บน</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label="ผู้ปกครอง" value={selectedGuardian ? `${selectedGuardian.firstName} ${selectedGuardian.lastName}` : "—"} />
            <Field label="ความสัมพันธ์" value={selectedGuardian?.relation.name ?? "—"} />
            <Field label="เบอร์โทรผู้ปกครอง" value={selectedGuardian?.phone ?? "—"} />
            <Field label="นักเรียน" value={studentFullName} />
            <Field label="ชั้น" value={`${student.gradeLevel}/${student.classRoom}`} />
            <Field label="เลขประจำตัว" value={student.studentCode} />
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400 mb-1">รายละเอียดความผิด</p>
            <p className="text-sm text-gray-700 bg-orange-50 rounded-lg px-3 py-2 leading-relaxed">
              {formData.detail || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Penalty actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 px-6 py-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold text-[#1c2434]">บทลงโทษหากทำผิดซ้ำ</h2>
          <span className="ml-auto text-xs text-red-500 font-medium">* เลือกอย่างน้อย 1 ข้อ</span>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            {BOND_PENALTY_OPTIONS.map((opt) => {
              const checked = bondData.penaltyActions.includes(opt.id)
              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                    checked ? "border-orange-300 bg-orange-50" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                      checked ? "bg-orange-500 border-orange-500" : "border-gray-300"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => togglePenalty(opt.id)} />
                  <span className={`text-sm font-medium ${checked ? "text-gray-800" : "text-gray-600"}`}>
                    {opt.label}
                  </span>
                  {opt.id === "deduct_score" && checked && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={bondData.deductPoints}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setBondData((prev) => ({ ...prev, deductPoints: e.target.value }))}
                        placeholder="0"
                        className="w-16 px-2 py-1 text-sm border border-orange-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400"
                      />
                      <span className="text-xs text-gray-500">คะแนน</span>
                    </div>
                  )}
                </label>
              )
            })}
          </div>

          <div className="pt-2">
            <FormGroup label="ชื่อพยาน">
              <input
                type="text"
                value={bondData.witnessName}
                onChange={(e) => setBondData((prev) => ({ ...prev, witnessName: e.target.value }))}
                placeholder="ชื่อ-นามสกุลพยาน (ถ้ามี)"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 placeholder:text-gray-300"
              />
            </FormGroup>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#465fff] hover:bg-[#3a4fd4] active:bg-[#2d3fc7] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          ถัดไป — ลงนาม
          <ChevronRight className="w-4 h-4" />
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

function SignaturePad({
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
    ctx.strokeStyle = "white"
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
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <div className={`relative rounded-lg border-2 border-dashed overflow-hidden ${value ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"}`}>
        {value ? (
          <img src={value} alt="signature" className="w-full h-28 object-contain" />
        ) : (
          <canvas
            ref={canvasRef}
            width={600}
            height={112}
            className="w-full h-28 cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        )}
        {!value && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-300 pointer-events-none select-none">
            เซ็นชื่อในช่องนี้
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={clear} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          ล้าง
        </button>
        {!value && (
          <button type="button" onClick={confirm} className="px-3 py-1.5 text-xs font-semibold text-white bg-[#465fff] hover:bg-[#3a4fd4] rounded-lg transition-colors">
            ยืนยัน
          </button>
        )}
        {value && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <Check className="w-3.5 h-3.5" />
            บันทึกแล้ว
          </span>
        )}
      </div>
    </div>
  )
}

function TeacherSignatureSelect({
  label,
  role,
  selectedId,
  onSelect,
}: {
  label: string
  role: string
  selectedId: number | null
  onSelect: (id: number | null, signatureUrl: string | null) => void
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
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      {loading ? (
        <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
      ) : teachers.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2">ไม่พบครูที่มีบทบาทนี้ในระบบ</p>
      ) : (
        <select
          value={selectedId ?? ""}
          onChange={(e) => {
            const tid = e.target.value ? Number(e.target.value) : null
            const teacher = teachers.find((t) => t.id === tid) ?? null
            onSelect(tid, teacher?.signatureUrl ?? null)
          }}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] bg-white text-gray-800"
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
        <div className="rounded-lg border border-[#465fff]/20 bg-[#eff2ff] px-4 py-3">
          {selected.signatureUrl ? (
            <img src={selected.signatureUrl} alt="signature" className="h-16 object-contain mx-auto" />
          ) : (
            <p className="text-xs text-gray-400 text-center italic">ยังไม่มีลายเซ็นในระบบ</p>
          )}
          <p className="text-[10px] text-center text-gray-500 mt-1">
            ลายเซ็น: {selected.title.name}{selected.firstName} {selected.lastName} (อัตโนมัติ)
          </p>
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
    <div className="space-y-4">
      <StudentMiniCard student={student} />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-[#465fff]/20 px-6 py-4 flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-[#465fff]" />
          <h2 className="text-sm font-bold text-[#1c2434]">ส่วนที่ 5: ลงนาม</h2>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <SignaturePad
              label="นักเรียน"
              value={signatureData.studentSignature}
              onChange={(v) => setSig("studentSignature", v)}
              onClear={() => setSig("studentSignature", "")}
            />
            <SignaturePad
              label="ผู้ปกครอง (รับทราบจากครูที่ปรึกษา)"
              value={signatureData.guardianSignature}
              onChange={(v) => setSig("guardianSignature", v)}
              onClear={() => setSig("guardianSignature", "")}
            />
          </div>

          <div className="border-t border-gray-100" />

          <div className="grid grid-cols-2 gap-6">
            <SignaturePad
              label={`ครูที่ปรึกษา${advisor ? ` (${advisor.title.name}${advisor.firstName} ${advisor.lastName})` : ""}`}
              value={signatureData.advisorSignature}
              onChange={(v) => setSig("advisorSignature", v)}
              onClear={() => setSig("advisorSignature", "")}
            />
            <TeacherSignatureSelect
              label="ครูฝ่ายปกครอง"
              role="ครูฝ่ายปกครอง"
              selectedId={signatureData.disciplineTeacherId}
              onSelect={(tid) => setSignatureData((prev) => ({ ...prev, disciplineTeacherId: tid }))}
            />
          </div>

          <div className="border-t border-gray-100" />

          <div className="max-w-xs">
            <TeacherSignatureSelect
              label="หัวหน้าระดับชั้น"
              role="หัวหน้าระดับชั้น"
              selectedId={signatureData.gradeHeadTeacherId}
              onSelect={(tid) => setSignatureData((prev) => ({ ...prev, gradeHeadTeacherId: tid }))}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#465fff] hover:bg-[#3a4fd4] active:bg-[#2d3fc7] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          ถัดไป — ยืนยัน
          <ChevronRight className="w-4 h-4" />
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
    if (!dt) return "-"
    const [datePart, timePart] = dt.split("T")
    const [year, month, day] = datePart.split("-")
    const monthName = THAI_MONTHS[Number(month) - 1]
    const beYear = Number(year) + 543
    return `${Number(day)} ${monthName} ${beYear}${timePart ? ` เวลา ${timePart} น.` : ""}`
  }

  const selectedMeasureLabels = [...CONSIDERATION_MEASURES, ...RESULT_MEASURES]
    .filter((m) => measureData.selected.includes(m.id))
    .map((m) => m.label)

  return (
    <div className="space-y-4">
      <StudentMiniCard student={student} />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <h2 className="text-sm font-bold text-[#1c2434]">สรุปข้อมูลก่อนบันทึก</h2>
        </div>

        <div className="divide-y divide-gray-50">
          <section className="px-6 py-4 space-y-3">
            <SectionTitle icon={<FileText className="w-3.5 h-3.5" />} label="ถ้อยคำ" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="ภาคเรียน" value={formData.semesterLabel} />
              <Field label="ปีการศึกษา" value={formData.academicYearLabel} />
              <Field label="หมวดการผิดระเบียบ" value={formData.violationCategoryLabel} />
              <Field label="วันที่เกิดเหตุ" value={formatThaiDateTime(formData.incidentDateTime)} />
              <Field label="สถานที่" value={formData.location} />
              <Field label="ผู้บันทึก" value={formData.recorder} />
            </div>
            <div className="pt-1">
              <p className="text-[11px] text-gray-400 mb-1">เรื่อง</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-3 py-2">{formData.subject}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-1">รายละเอียด</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-3 py-2">{formData.detail}</p>
            </div>
          </section>

          <section className="px-6 py-4">
            <SectionTitle icon={<ShieldAlert className="w-3.5 h-3.5" />} label="มาตรการ" />
            {selectedMeasureLabels.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {selectedMeasureLabels.map((label) => (
                  <li key={label} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-3.5 h-3.5 text-[#465fff] shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-400 italic">ไม่ได้เลือกมาตรการ</p>
            )}
            {measureData.notes && (
              <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{measureData.notes}</p>
            )}
          </section>

          {showBondStep && (
            <section className="px-6 py-4">
              <SectionTitle icon={<ScrollText className="w-3.5 h-3.5" />} label="ทัณฑ์บน" />
              <div className="mt-3 space-y-3">
                {bondData.selectedGuardianIndex !== null && student.guardians[bondData.selectedGuardianIndex] && (() => {
                  const g = student.guardians[bondData.selectedGuardianIndex!]
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="ผู้ปกครองลงนาม" value={`${g.firstName} ${g.lastName}`} />
                      <Field label="ความสัมพันธ์" value={g.relation.name} />
                    </div>
                  )
                })()}
                {bondData.penaltyActions.length > 0 && (
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1.5">บทลงโทษหากทำผิดซ้ำ</p>
                    <ul className="space-y-1">
                      {BOND_PENALTY_OPTIONS.filter((o) => bondData.penaltyActions.includes(o.id)).map((o) => (
                        <li key={o.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          {o.label}
                          {o.id === "deduct_score" && bondData.deductPoints && ` ${bondData.deductPoints} คะแนน`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {bondData.witnessName && <Field label="พยาน" value={bondData.witnessName} />}
              </div>
            </section>
          )}
        </div>
      </div>

      {saveError && (
        <div className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {saveError}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>
        <button
          onClick={onSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              กำลังบันทึก...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              บันทึกการแก้ไข
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Shared UI components ───────────────────────────────────────────────────────

function StudentMiniCard({ student }: { student: Student }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-[#465fff] flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">
          {student.title.name}{student.firstName} {student.lastName}
        </p>
        <p className="text-xs text-gray-400">
          รหัส {student.studentCode} · ชั้น {student.gradeLevel}/{student.classRoom} · เลขที่ {student.classNumber}
        </p>
      </div>
    </div>
  )
}

function FormGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function NativeSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] appearance-none cursor-pointer ${
        value ? "text-gray-800" : "text-gray-400"
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: "2rem",
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
      {icon}
      {label}
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm text-gray-800 font-medium ${mono ? "font-mono tracking-wide" : ""}`}>
        {value || "-"}
      </p>
    </div>
  )
}
