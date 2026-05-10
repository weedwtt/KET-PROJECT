"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, ChevronLeft, User, Users, MapPin, Check } from "lucide-react"

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
  { label: "ยืนยันและบันทึก", desc: "ตรวจสอบและบันทึก" },
]

// ── Root page ──────────────────────────────────────────────────────────────────

export default function NewStatementPage() {
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Student[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Student | null>(null)

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
    setStep((s) => Math.max(0, s - 1))
    if (step === 1) setSelected(null)
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
      <Stepper currentStep={step} />

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
        <Step2Student student={selected} onBack={handleBack} />
      )}
    </div>
  )
}

// ── Stepper indicator ──────────────────────────────────────────────────────────

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
      <div className="flex items-start">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 ${
                  i < currentStep
                    ? "bg-green-500 text-white"
                    : i === currentStep
                    ? "bg-[#F5A623] text-white ring-4 ring-amber-100"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div className="mt-2 text-center w-[72px]">
                <p
                  className={`text-[11px] font-semibold leading-tight ${
                    i === currentStep
                      ? "text-[#F5A623]"
                      : i < currentStep
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {s.label}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight hidden sm:block">{s.desc}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 mt-4 transition-colors duration-300 ${
                  i < currentStep ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
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

function Step2Student({ student, onBack }: { student: Student; onBack: () => void }) {
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
          disabled
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-400 text-sm font-semibold rounded-lg cursor-not-allowed"
          title="กำลังพัฒนา"
        >
          ถัดไป — บันทึกถ้อยคำ
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
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
