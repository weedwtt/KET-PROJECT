"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, ChevronLeft, User, Users, MapPin, Check, FileText, Clock } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

type Guardian = {
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

// ── Step config ────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "ค้นหานักเรียน", desc: "ค้นหาด้วยรหัสหรือชื่อ" },
  { label: "ข้อมูลนักเรียน", desc: "ยืนยันข้อมูลที่พบ" },
  { label: "บันทึกถ้อยคำ", desc: "กรอกรายละเอียด" },
  { label: "มาตรการ", desc: "เลือกการดำเนินการ" },
  { label: "ทำทัณฑ์บน", desc: "กรอกสัญญา" },
  { label: "ยืนยันและบันทึก", desc: "ตรวจสอบและบันทึก" },
]

// ── Constants ──────────────────────────────────────────────────────────────────

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

const VIOLATION_CATEGORIES = [
  "หมวดที่ 1 ความประพฤติและมารยาท",
  "หมวดที่ 2 การแต่งกายและการไว้ทรงผม",
  "หมวดที่ 3 ความรับผิดชอบในการเรียน",
  "หมวดที่ 4 การใช้สิ่งเสพติดและอบายมุข",
  "หมวดที่ 5 ทรัพย์สินและความสะอาด",
  "หมวดที่ 6 ความปลอดภัยและการทะเลาะวิวาท",
  "หมวดที่ 7 อื่น ๆ",
]

type StatementFormData = {
  semester: string
  academicYear: string
  violationCategory: string
  subject: string
  detail: string
  incidentDay: string
  incidentMonth: string
  incidentYear: string
  incidentTime: string
  location: string
  recorder: string
}

// ── Root page ──────────────────────────────────────────────────────────────────

export default function NewStatementPage() {
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Student[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [formData, setFormData] = useState<StatementFormData>({
    semester: "",
    academicYear: "",
    violationCategory: "",
    subject: "",
    detail: "",
    incidentDay: "",
    incidentMonth: "",
    incidentYear: "",
    incidentTime: "",
    location: "",
    recorder: "",
  })

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
    setStep((s) => s + 1)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/record/statement"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#2D1B00]">เพิ่มบันทึกถ้อยคำ</h1>
          <p className="text-sm text-gray-400 mt-0.5">บันทึกถ้อยคำนักเรียน</p>
        </div>
      </div>

      {/* Stepper */}
      <Stepper currentStep={step} showBondStep={false} />

      {/* Step panels */}
      {step === 0 && (
        <Step1Search
          query={query}
          setQuery={setQuery}
          searching={searching}
          results={results}
          error={searchError}
          onSearch={handleSearch}
          onSelect={selectStudent}
        />
      )}

      {step === 1 && selected && (
        <Step2Student student={selected} onBack={handleBack} onNext={handleNext} />
      )}

      {step === 2 && selected && (
        <Step3Statement
          student={selected}
          formData={formData}
          setFormData={setFormData}
          onBack={handleBack}
          onNext={handleNext}
        />
      )}
    </div>
  )
}

// ── Stepper indicator ──────────────────────────────────────────────────────────

// Step index 4 (ทำทัณฑ์บน) is conditional — hidden until step 3 activates it
function Stepper({ currentStep, showBondStep }: { currentStep: number; showBondStep?: boolean }) {
  const visibleSteps = STEPS.filter((_, i) => i !== 4 || showBondStep)

  // Map visible index to actual step index for coloring
  const actualIndices = STEPS.map((_, i) => i).filter((i) => i !== 4 || showBondStep)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-5">
      <div className="flex items-start">
        {visibleSteps.map((s, vi) => {
          const ai = actualIndices[vi]
          return (
            <div key={ai} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                    ai < currentStep
                      ? "bg-green-500 text-white"
                      : ai === currentStep
                      ? "bg-[#F5A623] text-white ring-4 ring-amber-100"
                      : ai === 4 && !showBondStep
                      ? "bg-gray-100 text-gray-300 ring-2 ring-dashed ring-gray-200"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {ai < currentStep ? <Check className="w-3.5 h-3.5" /> : vi + 1}
                </div>
                <div className="mt-2 text-center w-[60px]">
                  <p
                    className={`text-[10px] font-semibold leading-tight ${
                      ai === currentStep
                        ? "text-[#F5A623]"
                        : ai < currentStep
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </p>
                </div>
              </div>
              {vi < visibleSteps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1.5 mt-3.5 transition-colors duration-300 ${
                    ai < currentStep ? "bg-green-400" : "bg-gray-200"
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
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-1">ค้นหานักเรียน</h2>
        <p className="text-xs text-gray-400 mb-4">พิมพ์รหัสประจำตัวนักเรียน หรือชื่อ-นามสกุล</p>

        <form onSubmit={onSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="เช่น 42344 หรือ สมชาย"
              autoFocus
              disabled={searching}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || searching}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#e09518] active:bg-[#cc8610] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {searching ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Search className="w-4 h-4" />
            )}
            ค้นหา
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {results && results.length === 0 && !error && (
          <p className="mt-4 text-sm text-gray-400 text-center py-2">ไม่พบข้อมูล</p>
        )}
      </div>

      {/* Multiple results list */}
      {results && results.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-amber-50/60">
            <p className="text-xs font-semibold text-[#B87800]">
              พบ {results.length} รายการ — เลือกนักเรียนที่ต้องการบันทึก
            </p>
          </div>
          <ul className="divide-y divide-gray-50">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-amber-50/50 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-[#F5A623]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {s.title.name}{s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        รหัส {s.studentCode} · {s.gradeLevel}/{s.classRoom} · เลขที่ {s.classNumber}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#F5A623] transition-colors shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Step 2: Confirm student info ───────────────────────────────────────────────

function Step2Student({ student, onBack, onNext }: { student: Student; onBack: () => void; onNext: () => void }) {
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
    return new Date(d).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  function teacherName(t: { title: { name: string }; firstName: string; lastName: string }) {
    return `${t.title.name}${t.firstName} ${t.lastName}`
  }

  return (
    <div className="space-y-4">
      {/* Student card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#F5A623] flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg truncate">{fullName}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs bg-amber-100 text-[#B87800] font-semibold px-2.5 py-0.5 rounded-full">
                รหัส {student.studentCode}
              </span>
              <span className="text-xs text-gray-500">
                ชั้น {student.gradeLevel}/{student.classRoom} · เลขที่ {student.classNumber}
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {/* Personal info section */}
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

          {/* Family & advisors section */}
          <section className="px-6 py-5">
            <SectionTitle icon={<Users className="w-3.5 h-3.5" />} label="ครอบครัวและครูที่ปรึกษา" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
              <Field
                label="บิดาชื่อ"
                value={father ? `${father.firstName} ${father.lastName}` : "-"}
              />
              <Field
                label="มารดาชื่อ"
                value={mother ? `${mother.firstName} ${mother.lastName}` : "-"}
              />
              {otherGuardian && (
                <Field
                  label={`ผู้ปกครอง (${otherGuardian.relation.name})`}
                  value={`${otherGuardian.firstName} ${otherGuardian.lastName}`}
                />
              )}
              <Field
                label="ครูที่ปรึกษา (1)"
                value={advisor1 ? teacherName(advisor1) : "-"}
              />
              <Field
                label="ครูที่ปรึกษา (2)"
                value={advisor2 ? teacherName(advisor2) : "-"}
              />
            </div>
          </section>

          {/* Address section */}
          <section className="px-6 py-5">
            <SectionTitle icon={<MapPin className="w-3.5 h-3.5" />} label="ที่อยู่" />
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              {addressParts.length > 0 ? addressParts.join(" ") : "-"}
            </p>
          </section>
        </div>
      </div>

      {/* Navigation buttons */}
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
          className="flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#e09518] active:bg-[#cc8610] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          ถัดไป — บันทึกถ้อยคำ
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Statement form ─────────────────────────────────────────────────────

interface Step3Props {
  student: Student
  formData: StatementFormData
  setFormData: React.Dispatch<React.SetStateAction<StatementFormData>>
  onBack: () => void
  onNext: () => void
}

function Step3Statement({ student, formData, setFormData, onBack, onNext }: Step3Props) {
  const currentBEYear = new Date().getFullYear() + 543
  const academicYears = Array.from({ length: 5 }, (_, i) => String(currentBEYear - i))

  function update(field: keyof StatementFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isValid =
    formData.semester &&
    formData.academicYear &&
    formData.violationCategory &&
    formData.subject.trim() &&
    formData.detail.trim() &&
    formData.incidentDay &&
    formData.incidentMonth &&
    formData.incidentYear &&
    formData.location.trim() &&
    formData.recorder.trim()

  return (
    <div className="space-y-4">
      {/* Student mini-card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center shrink-0">
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

      {/* Form card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#F5A623]" />
          <h2 className="text-sm font-bold text-[#2D1B00]">บันทึกถ้อยคำ</h2>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Row 1: Semester + Category */}
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="ภาคเรียน" required>
              <NativeSelect
                value={formData.semester}
                onChange={(v) => update("semester", v)}
                placeholder="เลือกภาคเรียน"
                options={[
                  { value: "1", label: "ภาคเรียนที่ 1" },
                  { value: "2", label: "ภาคเรียนที่ 2" },
                ]}
              />
            </FormGroup>

            <FormGroup label="ปีการศึกษา" required>
              <NativeSelect
                value={formData.academicYear}
                onChange={(v) => update("academicYear", v)}
                placeholder="เลือกปีการศึกษา"
                options={academicYears.map((y) => ({ value: y, label: y }))}
              />
            </FormGroup>
          </div>

          {/* Violation category */}
          <FormGroup label="ได้ประพฤติผิดระเบียบในหมวด" required>
            <NativeSelect
              value={formData.violationCategory}
              onChange={(v) => update("violationCategory", v)}
              placeholder="เลือกหมวด"
              options={VIOLATION_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </FormGroup>

          {/* Subject */}
          <FormGroup label="เรื่อง" required>
            <textarea
              value={formData.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="กรอกพฤติกรรมที่กระทำความผิด"
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] placeholder:text-gray-300"
            />
          </FormGroup>

          {/* Detail */}
          <FormGroup label="ซึ่งมีรายละเอียดการผิดระเบียบ คือ" required>
            <textarea
              value={formData.detail}
              onChange={(e) => update("detail", e.target.value)}
              placeholder="กรอกรายละเอียดการกระทำความผิด"
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] placeholder:text-gray-300"
            />
          </FormGroup>

          {/* Incident date + time */}
          <FormGroup label="เหตุเกิดเมื่อวันที่" required>
            <div className="flex gap-2">
              <NativeSelect
                value={formData.incidentDay}
                onChange={(v) => update("incidentDay", v)}
                placeholder="วัน"
                className="w-[90px]"
                options={Array.from({ length: 31 }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                }))}
              />
              <NativeSelect
                value={formData.incidentMonth}
                onChange={(v) => update("incidentMonth", v)}
                placeholder="เดือน"
                options={THAI_MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
              />
              <NativeSelect
                value={formData.incidentYear}
                onChange={(v) => update("incidentYear", v)}
                placeholder="ปี"
                className="w-[110px]"
                options={Array.from({ length: 5 }, (_, i) => {
                  const y = String(currentBEYear - i)
                  return { value: y, label: y }
                })}
              />
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={formData.incidentTime}
                  onChange={(e) => update("incidentTime", e.target.value)}
                  placeholder="เวลา เช่น 13.00 น."
                  className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] placeholder:text-gray-300"
                />
              </div>
            </div>
          </FormGroup>

          {/* Location + Recorder */}
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="สถานที่เกิดเหตุ" required>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="ระบุสถานที่"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] placeholder:text-gray-300"
              />
            </FormGroup>

            <FormGroup label="ผู้บันทึกข้อมูล" required>
              <input
                type="text"
                value={formData.recorder}
                onChange={(e) => update("recorder", e.target.value)}
                placeholder="ชื่อผู้บันทึก"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] placeholder:text-gray-300"
              />
            </FormGroup>
          </div>

          {/* Auto date note */}
          <p className="text-xs text-[#F5A623] font-medium">
            ลงวันที่: ประทับวันอัตโนมัติเมื่อบันทึกข้อมูล
          </p>
        </div>
      </div>

      {/* Navigation */}
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
          className="flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#e09518] active:bg-[#cc8610] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          ถัดไป — มาตรการ
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Form helpers ───────────────────────────────────────────────────────────────

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
  className = "",
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623] appearance-none cursor-pointer ${
        value ? "text-gray-800" : "text-gray-400"
      } ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: "2rem",
      }}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ── Shared UI atoms ────────────────────────────────────────────────────────────

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
