"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft, FileText, ShieldAlert, ScrollText, CheckCircle2,
  User, Users, Clock, MapPin, Pencil, Check,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

type StatementDetail = {
  id: number
  recordDate: string
  recordedBy: string
  status: string
  approvedAt: string | null
  subject: string
  content: string
  incidentAt: string | null
  location: string | null
  considerationMeasures: string[]
  resultMeasures: string[]
  measureNotes: string | null
  studentSignature: string | null
  guardianSignature: string | null
  advisorSignature: string | null
  semester: { id: number; name: string; value: number }
  academicYear: { id: number; year: number }
  violationCategory: { id: number; name: string }
  student: {
    id: number; studentCode: string; firstName: string; lastName: string
    gradeLevel: string; classRoom: number; classNumber: number
    title: { name: string }
    guardians: { id: number; firstName: string; lastName: string; phone: string; relation: { name: string } }[]
    advisors: { slot: number; teacher: { firstName: string; lastName: string; title: { name: string } } }[]
  }
  bond: {
    id: number; guardianId: number; penaltyActions: string[]
    deductPoints: number | null; witnessName: string | null
  } | null
  disciplineTeacher: { id: number; firstName: string; lastName: string; title: { name: string }; signatureUrl: string | null } | null
  gradeHeadTeacher: { id: number; firstName: string; lastName: string; title: { name: string }; signatureUrl: string | null } | null
  approvedByTeacher: { id: number; firstName: string; lastName: string; title: { name: string } } | null
}

type Approver = {
  id: number; firstName: string; lastName: string; role: string | null
  title: { name: string }
}

const CONSIDERATION_LABELS: Record<string, string> = {
  notify_parent: "แจ้งผู้ปกครอง",
  invite_parent: "เชิญผู้ปกครองรับทราบพฤติกรรม",
}
const RESULT_LABELS: Record<string, string> = {
  verbal_warning: "ตักเตือน",
  deduct_score: "ตัดคะแนนความประพฤติ",
  behavior_activity: "ทำกิจกรรมปรับเปลี่ยนพฤติกรรม",
  probation_bond: "ทำทัณฑ์บน",
}
const PENALTY_LABELS: Record<string, string> = {
  deduct_score: "ตัดคะแนนความประพฤติ",
  behavior_camp: "ทำกิจกรรมค่ายปรับพฤติกรรม",
  suspension: "พักการเรียน",
  transfer: "ย้ายสถานศึกษา",
}
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"]

function formatThaiDate(d: string | null) {
  if (!d) return "-"
  const dt = new Date(d)
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543}`
}
function formatThaiDateTime(d: string | null) {
  if (!d) return "-"
  const dt = new Date(d)
  const time = `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543} เวลา ${time} น.`
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StatementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [record, setRecord] = useState<StatementDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [selectedApproverId, setSelectedApproverId] = useState("")
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/statements/${id}`).then((r) => r.json()),
      fetch("/api/teachers/approvers").then((r) => r.json()),
    ]).then(([rec, apv]) => {
      setRecord(rec)
      setApprovers(apv)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  async function handleApprove() {
    if (!selectedApproverId) return
    setApproving(true)
    setApproveError(null)
    try {
      const res = await fetch(`/api/statements/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: Number(selectedApproverId) }),
      })
      if (!res.ok) {
        const err = await res.json()
        setApproveError(err.error ?? "เกิดข้อผิดพลาด")
        return
      }
      router.refresh()
      // reload record
      const updated = await fetch(`/api/statements/${id}`).then((r) => r.json())
      setRecord(updated)
    } catch {
      setApproveError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setApproving(false)
    }
  }

  if (loading) return (
    <div className="p-6 flex justify-center items-center min-h-[300px]">
      <svg className="w-6 h-6 animate-spin text-[#F5A623]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  )

  if (!record) return (
    <div className="p-6 text-center text-gray-500">ไม่พบรายการ</div>
  )

  const isApproved = record.status === "approved"
  const advisor1 = record.student.advisors.find((a) => a.slot === 1)?.teacher
  const bondGuardian = record.bond
    ? record.student.guardians.find((g) => g.id === record.bond!.guardianId)
    : null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/record/statement" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#2D1B00]">รายละเอียดบันทึกถ้อยคำ</h1>
          <p className="text-sm text-gray-400 mt-0.5">#{record.id} · บันทึกวันที่ {formatThaiDate(record.recordDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          {isApproved ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว
            </span>
          ) : (
            <>
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                รอดำเนินการ
              </span>
              <Link
                href={`/record/statement/${id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-[#F5A623] hover:border-[#F5A623] text-xs font-semibold rounded-lg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> แก้ไข
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Student mini card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#F5A623] flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">
            {record.student.title.name}{record.student.firstName} {record.student.lastName}
          </p>
          <p className="text-xs text-gray-400">
            รหัส {record.student.studentCode} · ชั้น {record.student.gradeLevel}/{record.student.classRoom} · เลขที่ {record.student.classNumber}
          </p>
        </div>
      </div>

      {/* Statement info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#F5A623]" />
          <h2 className="text-sm font-bold text-[#2D1B00]">บันทึกถ้อยคำ</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <Field label="ภาคเรียน" value={record.semester.name} />
            <Field label="ปีการศึกษา" value={String(record.academicYear.year)} />
            <Field label="หมวดการผิดระเบียบ" value={record.violationCategory.name} />
            <Field label="วัน-เวลาเกิดเหตุ" value={formatThaiDateTime(record.incidentAt)} />
            <Field label="สถานที่เกิดเหตุ" value={record.location ?? "-"} />
            <Field label="ผู้บันทึก" value={record.recordedBy} />
          </div>
          <div className="pt-1 space-y-3">
            <LongField label="เรื่อง" value={record.subject} />
            <LongField label="รายละเอียดการกระทำความผิด" value={record.content} />
          </div>
        </div>
      </div>

      {/* Measures */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#F5A623]" />
          <h2 className="text-sm font-bold text-[#2D1B00]">มาตรการ / การดำเนินการ</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {record.considerationMeasures.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#F5A623] mb-2">ส่วนที่ 3: การพิจารณา</p>
              <ul className="space-y-1">
                {record.considerationMeasures.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                    {CONSIDERATION_LABELS[m] ?? m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {record.resultMeasures.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#F5A623] mb-2">ส่วนที่ 4: ผลการพิจารณา</p>
              <ul className="space-y-1">
                {record.resultMeasures.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                    {RESULT_LABELS[m] ?? m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {record.measureNotes && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{record.measureNotes}</p>
          )}
          {record.considerationMeasures.length === 0 && record.resultMeasures.length === 0 && (
            <p className="text-sm text-gray-400 italic">ไม่ได้เลือกมาตรการ</p>
          )}
        </div>
      </div>

      {/* Bond (conditional) */}
      {record.bond && (
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 px-6 py-4 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-bold text-[#2D1B00]">สัญญาทัณฑ์บน</h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            {bondGuardian && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="ผู้ปกครองลงนาม" value={`${bondGuardian.firstName} ${bondGuardian.lastName}`} />
                <Field label="ความสัมพันธ์" value={bondGuardian.relation.name} />
                {bondGuardian.phone && <Field label="เบอร์โทร" value={bondGuardian.phone} />}
              </div>
            )}
            {record.bond.penaltyActions.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">บทลงโทษหากทำผิดซ้ำ</p>
                <ul className="space-y-1">
                  {record.bond.penaltyActions.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      {PENALTY_LABELS[p] ?? p}
                      {p === "deduct_score" && record.bond!.deductPoints && ` ${record.bond!.deductPoints} คะแนน`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {record.bond.witnessName && <Field label="พยาน" value={record.bond.witnessName} />}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#F5A623]" />
          <h2 className="text-sm font-bold text-[#2D1B00]">ลายเซ็น</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-6">
          <SigBox label="นักเรียน" dataUrl={record.studentSignature} />
          <SigBox label="ผู้ปกครอง" dataUrl={record.guardianSignature} />
          <SigBox
            label={`ครูที่ปรึกษา${advisor1 ? ` (${advisor1.title.name}${advisor1.firstName} ${advisor1.lastName})` : ""}`}
            dataUrl={record.advisorSignature}
          />
          {record.disciplineTeacher && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">ครูฝ่ายปกครอง</p>
              <p className="text-sm text-gray-700">
                {record.disciplineTeacher.title.name}{record.disciplineTeacher.firstName} {record.disciplineTeacher.lastName}
              </p>
              {record.disciplineTeacher.signatureUrl && (
                <img src={record.disciplineTeacher.signatureUrl} alt="sig" className="h-16 mt-1 object-contain" />
              )}
            </div>
          )}
          {record.gradeHeadTeacher && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">หัวหน้าระดับชั้น</p>
              <p className="text-sm text-gray-700">
                {record.gradeHeadTeacher.title.name}{record.gradeHeadTeacher.firstName} {record.gradeHeadTeacher.lastName}
              </p>
              {record.gradeHeadTeacher.signatureUrl && (
                <img src={record.gradeHeadTeacher.signatureUrl} alt="sig" className="h-16 mt-1 object-contain" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Approve section */}
      {isApproved ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-green-800">อนุมัติแล้ว</p>
            <p className="text-sm text-green-700 mt-0.5">
              โดย {record.approvedByTeacher?.title.name}{record.approvedByTeacher?.firstName} {record.approvedByTeacher?.lastName}
              {record.approvedAt && ` · ${formatThaiDateTime(record.approvedAt)}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h2 className="text-sm font-bold text-[#2D1B00]">การอนุมัติ (ผอ / รองผอ)</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {approvers.length === 0 ? (
              <p className="text-sm text-gray-400 italic">ไม่พบผู้อนุมัติในระบบ (กรุณาเพิ่มครูที่มีบทบาท ผอ หรือ รองผอ)</p>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">เลือกผู้อนุมัติ</label>
                  <select
                    value={selectedApproverId}
                    onChange={(e) => setSelectedApproverId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-500"
                  >
                    <option value="">— เลือกผู้อนุมัติ —</option>
                    {approvers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title.name}{t.firstName} {t.lastName} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>
                {approveError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{approveError}</p>
                )}
                <button
                  onClick={handleApprove}
                  disabled={!selectedApproverId || approving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {approving ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  อนุมัติบันทึกถ้อยคำนี้
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || "-"}</p>
    </div>
  )
}

function LongField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap">{value || "-"}</p>
    </div>
  )
}

function SigBox({ label, dataUrl }: { label: string; dataUrl: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1">{label}</p>
      <div className={`rounded-lg border-2 border-dashed ${dataUrl ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"} h-20 flex items-center justify-center overflow-hidden`}>
        {dataUrl
          ? <img src={dataUrl} alt="signature" className="h-full object-contain" />
          : <p className="text-xs text-gray-300">ไม่มีลายเซ็น</p>
        }
      </div>
    </div>
  )
}
