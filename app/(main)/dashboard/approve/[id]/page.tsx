"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft, CheckCircle2, ShieldCheck, Check, User, UserCheck,
} from "lucide-react"
import { toast } from "sonner"

// ── Types ──────────────────────────────────────────────────────────────────────

type StatementDetail = {
  id: number
  recordDate: string
  recordedBy: string | null
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
  disciplineTeacherSignature: string | null
  gradeHeadSignature: string | null
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

type DelegatePrincipal = {
  id: number
  firstName: string
  lastName: string
  role: string | null
  signatureUrl: string | null
  title: { name: string }
}

type MyTeacher = {
  id: number
  firstName: string
  lastName: string
  role: string | null
  gradeHeadLevel: string | null
  signatureUrl: string | null
  title: { name: string }
  delegateFor: { principal: DelegatePrincipal }[]
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
const ROLE_LABEL: Record<string, string> = {
  DIRECTOR: "ผู้อำนวยการ",
  VICE_DIRECTOR: "รองผู้อำนวยการ",
  ADMIN: "ผู้ดูแลระบบ",
  TEACHER: "ครู",
}
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"]

function formatThaiDate(d: string | null) {
  if (!d) return "—"
  const dt = new Date(d)
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543}`
}
function formatThaiDateTime(d: string | null) {
  if (!d) return "—"
  const dt = new Date(d)
  const time = `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543} เวลา ${time} น.`
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ApproveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [record, setRecord] = useState<StatementDetail | null>(null)
  const [me, setMe] = useState<MyTeacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<number | null>(null)
  const [forwarding, setForwarding] = useState(false)
  const [forwardError, setForwardError] = useState<string | null>(null)
  const [disciplineForwarding, setDisciplineForwarding] = useState(false)
  const [disciplineForwardError, setDisciplineForwardError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/statements/${id}`).then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ]).then(([rec, teacher]) => {
      setRecord(rec); setMe(teacher); setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  async function handleDisciplineForward() {
    setDisciplineForwarding(true); setDisciplineForwardError(null)
    try {
      const res = await fetch(`/api/statements/${id}/discipline-approve`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        setDisciplineForwardError(err.error ?? "เกิดข้อผิดพลาด")
        toast.error(err.error ?? "เกิดข้อผิดพลาด")
        return
      }
      toast.success("ลงนามสำเร็จ")
      router.push("/dashboard/approve")
    } catch {
      setDisciplineForwardError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setDisciplineForwarding(false)
    }
  }

  async function handleGradeHeadForward() {
    setForwarding(true); setForwardError(null)
    try {
      const res = await fetch(`/api/statements/${id}/grade-head-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        const err = await res.json()
        setForwardError(err.error ?? "เกิดข้อผิดพลาด")
        toast.error(err.error ?? "เกิดข้อผิดพลาด")
        return
      }
      toast.success("ส่งต่อให้ผู้อำนวยการเรียบร้อย")
      router.push("/dashboard/approve")
    } catch {
      setForwardError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setForwarding(false)
    }
  }

  async function handleApprove() {
    if (!me) return
    setApproving(true); setApproveError(null)
    try {
      const res = await fetch(`/api/statements/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: me.id,
          signatureTeacherId: selectedPrincipalId ?? me.id,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setApproveError(err.error ?? "เกิดข้อผิดพลาด")
        toast.error(err.error ?? "เกิดข้อผิดพลาด")
        return
      }
      const result = await res.json()
      toast.success(result.status === "pending_director" ? "ส่งต่อให้ผอ.เรียบร้อย" : "อนุมัติบันทึกถ้อยคำสำเร็จ")
      router.push("/dashboard/approve")
    } catch {
      setApproveError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setApproving(false)
    }
  }

  if (loading) return (
    <div className="ks-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="spin" style={{ color: "var(--indigo)" }}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/>
        <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  )

  if (!record) return (
    <div className="ks-page" style={{ textAlign: "center", color: "var(--ink-3)" }}>ไม่พบรายการ</div>
  )

  const isApproved = record.status === "approved"
  const isGradeHeadPending = record.status === "pending_grade_head"
  const isTeacherSignaturesPending = record.status === "pending_teacher_signatures"
  const isDisciplinePending = record.status === "pending_discipline_teacher"
  const isViceDirectorPending = record.status === "pending"
  const isDirectorPending = record.status === "pending_director"

  // ฝ่ายปกครอง: เป็นคนนี้ และยังไม่ได้ลงนาม
  const isMyDisciplineItem = (isDisciplinePending || isTeacherSignaturesPending)
    && me?.id === record.disciplineTeacher?.id
    && !record.disciplineTeacherSignature

  // หัวหน้าระดับ: เป็นคนนี้ และยังไม่ได้ลงนาม
  const isMyGradeHeadItem = (isGradeHeadPending || isTeacherSignaturesPending)
    && me?.id === record.gradeHeadTeacher?.id
    && !record.gradeHeadSignature

  const advisor1 = record.student.advisors.find((a) => a.slot === 1)?.teacher
  const bondGuardian = record.bond
    ? record.student.guardians.find((g) => g.id === record.bond!.guardianId)
    : null
  const approverName = me ? `${me.title.name}${me.firstName} ${me.lastName}` : ""

  const isDelegateApprover = (me?.delegateFor?.length ?? 0) > 0
  const principals = me?.delegateFor?.map((d) => d.principal) ?? []

  // รองผอ: สถานะ pending และ role เป็น VICE_DIRECTOR
  const isViceDirectorApprover = isViceDirectorPending && me?.role === "VICE_DIRECTOR"
  // ผอ: สถานะ pending_director และ role เป็น DIRECTOR หรือ ADMIN
  const isDirectorApprover = isDirectorPending && (me?.role === "DIRECTOR" || me?.role === "ADMIN")
  // ADMIN ที่สถานะ pending ก็อนุมัติได้ (ข้ามทั้งสองขั้น)
  const isAdminAnyStep = me?.role === "ADMIN" && (isViceDirectorPending || isDirectorPending)
  // ผู้รับมอบอำนาจ: เห็นเมื่อสถานะรออนุมัติ (pending หรือ pending_director)
  const isDelegateActiveStep = isDelegateApprover && (isViceDirectorPending || isDirectorPending)
  const principalNames = principals.map(
    (p) => `${p.title.name}${p.firstName} ${p.lastName}`
  ).join(" / ")

  const approverRoleLabel = isDelegateApprover
    ? "ผู้รับมอบอำนาจ"
    : ROLE_LABEL[me?.role ?? ""] ?? me?.role ?? ""

  // ลายเซ็นที่จะใช้ในเอกสาร
  const selectedPrincipal = principals.find((p) => p.id === selectedPrincipalId) ?? null
  const sigUrl = isDelegateApprover ? selectedPrincipal?.signatureUrl ?? null : me?.signatureUrl ?? null
  const sigName = isDelegateApprover && selectedPrincipal
    ? `${selectedPrincipal.title.name}${selectedPrincipal.firstName} ${selectedPrincipal.lastName}`
    : approverName

  // Step-aware variables for รองผอ/ผอ approve panel
  const stepRole = isViceDirectorPending ? "VICE_DIRECTOR" : "DIRECTOR"
  const stepPrincipals = isDelegateApprover
    ? principals.filter((p) => p.role === stepRole || p.role === "ADMIN")
    : principals
  const selectedStepPrincipal = stepPrincipals.find((p) => p.id === selectedPrincipalId) ?? null
  const stepSigUrl = isDelegateApprover ? selectedStepPrincipal?.signatureUrl ?? null : me?.signatureUrl ?? null
  const stepSigName = isDelegateApprover && selectedStepPrincipal
    ? `${selectedStepPrincipal.title.name}${selectedStepPrincipal.firstName} ${selectedStepPrincipal.lastName}`
    : approverName
  const isViceStep = isViceDirectorApprover || (isDelegateActiveStep && isViceDirectorPending && !isAdminAnyStep)

  const allMeasures = [
    ...record.considerationMeasures.map((m) => CONSIDERATION_LABELS[m] ?? m),
    ...record.resultMeasures.map((m) => RESULT_LABELS[m] ?? m),
  ]

  return (
    <div className="ks-page" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/approve" className="btn btn-ghost btn-sm btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="page-eyebrow">
              <span>ฝ่ายปกครอง · รายละเอียดรายการ #{record.id}</span>
            </div>
            <h1>รายละเอียดบันทึกถ้อยคำ</h1>
          </div>
        </div>
        <div>
          <span className={`chip ${isApproved ? "chip-approved" : "chip-pending"}`}>
            {isApproved ? "อนุมัติแล้ว"
              : isTeacherSignaturesPending ? "รอลงนาม 2 ฝ่าย"
              : isDisciplinePending ? "รอฝ่ายปกครอง"
              : isGradeHeadPending ? "รอหัวหน้าระดับ"
              : isViceDirectorPending ? "รอรองผอ."
              : isDirectorPending ? "รอผอ."
              : "รออนุมัติ"}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        {/* ── Main content column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>

          {/* Student */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow">01 · STUDENT</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  {record.student.title.name}{record.student.firstName} {record.student.lastName}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 13, color: "var(--ink-3)" }}>{record.student.studentCode}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  ชั้น {record.student.gradeLevel}/{record.student.classRoom} · เลขที่ {record.student.classNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Incident */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div className="eyebrow">02 · INCIDENT</div>
            </div>
            <div className="ks-card-pad">
              <div className="info-row">
                <span className="info-label">ภาคเรียน</span>
                <span className="info-value">{record.semester.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">ปีการศึกษา</span>
                <span className="info-value mono">{record.academicYear.year}</span>
              </div>
              <div className="info-row">
                <span className="info-label">หมวดการผิดระเบียบ</span>
                <span className="info-value">{record.violationCategory.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">วันเวลาเกิดเหตุ</span>
                <span className="info-value">{formatThaiDateTime(record.incidentAt)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">สถานที่</span>
                <span className="info-value">{record.location ?? "—"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">ผู้บันทึก</span>
                <span className="info-value">{record.recordedBy}</span>
              </div>
              <div className="info-row">
                <span className="info-label">วันที่บันทึก</span>
                <span className="info-value mono">{formatThaiDate(record.recordDate)}</span>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>เรื่อง</div>
                <div style={{ fontSize: 13.5, padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--radius)", lineHeight: 1.7 }}>
                  {record.subject}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>รายละเอียด</div>
                <div style={{ fontSize: 13.5, padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--radius)", lineHeight: 1.7 }}>
                  {record.content}
                </div>
              </div>
            </div>
          </div>

          {/* Measures */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div className="eyebrow">03 · MEASURES</div>
            </div>
            <div className="ks-card-pad">
              {allMeasures.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {allMeasures.map((label) => (
                    <span key={label} className="measure-tag">
                      <span className="dot" /> {label}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13.5, color: "var(--ink-4)" }}>ไม่ได้เลือกมาตรการ</div>
              )}
              {record.measureNotes && (
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--ink-3)", padding: "8px 12px", background: "var(--surface-2)", borderRadius: "var(--radius)" }}>
                  {record.measureNotes}
                </div>
              )}
            </div>
          </div>

          {/* Bond */}
          {record.bond && (
            <div className="ks-card">
              <div className="ks-card-header">
                <div className="eyebrow">05 · BOND</div>
              </div>
              <div className="ks-card-pad">
                {bondGuardian && (
                  <>
                    <div className="info-row">
                      <span className="info-label">ผู้ปกครองลงนาม</span>
                      <span className="info-value">{bondGuardian.firstName} {bondGuardian.lastName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">ความสัมพันธ์</span>
                      <span className="info-value">{bondGuardian.relation.name}</span>
                    </div>
                    {bondGuardian.phone && (
                      <div className="info-row">
                        <span className="info-label">เบอร์โทร</span>
                        <span className="info-value mono">{bondGuardian.phone}</span>
                      </div>
                    )}
                  </>
                )}
                {record.bond.penaltyActions.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>บทลงโทษหากทำผิดซ้ำ</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {record.bond.penaltyActions.map((p) => (
                        <span key={p} className="measure-tag" style={{ background: "var(--amber-wash, #fffbeb)", color: "var(--amber)" }}>
                          <span className="dot" style={{ background: "var(--amber)" }} />
                          {PENALTY_LABELS[p] ?? p}
                          {p === "deduct_score" && record.bond!.deductPoints && ` ${record.bond!.deductPoints} คะแนน`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {record.bond.witnessName && (
                  <div className="info-row" style={{ marginTop: 12 }}>
                    <span className="info-label">พยาน</span>
                    <span className="info-value">{record.bond.witnessName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div className="eyebrow">04 · SIGNATURES</div>
            </div>
            <div className="ks-card-pad">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <SigBox label="นักเรียน" dataUrl={record.studentSignature} />
                <SigBox label="ผู้ปกครอง" dataUrl={record.guardianSignature} />
                <SigBox
                  label={`ครูที่ปรึกษา${advisor1 ? ` — ${advisor1.title.name}${advisor1.firstName} ${advisor1.lastName}` : ""}`}
                  dataUrl={record.advisorSignature}
                />
              </div>
              {(record.disciplineTeacher || record.gradeHeadTeacher) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                  {record.disciplineTeacher && (
                    <SigBox
                      label={`ครูฝ่ายปกครอง — ${record.disciplineTeacher.title.name}${record.disciplineTeacher.firstName} ${record.disciplineTeacher.lastName}`}
                      dataUrl={record.disciplineTeacher.signatureUrl}
                    />
                  )}
                  {record.gradeHeadTeacher && (
                    <SigBox
                      label={`หัวหน้าระดับชั้น — ${record.gradeHeadTeacher.title.name}${record.gradeHeadTeacher.firstName} ${record.gradeHeadTeacher.lastName}`}
                      dataUrl={record.gradeHeadSignature || record.gradeHeadTeacher.signatureUrl}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar: approval ── */}
        <div style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: "var(--gap)" }}>

          {/* Delegate notice */}
          {isDelegateApprover && !isApproved && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px", borderRadius: "var(--radius)",
              background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)",
            }}>
              <UserCheck size={15} style={{ color: "var(--indigo)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--indigo)", marginBottom: 2 }}>
                  อนุมัติในนาม
                </div>
                <div style={{ fontSize: 12, color: "var(--indigo-ink)", lineHeight: 1.5 }}>
                  {principalNames}
                </div>
              </div>
            </div>
          )}

          {/* ── Discipline teacher forward panel ── */}
          {isMyDisciplineItem && (
            <div className="ks-card">
              <div className="ks-card-header">
                <div className="eyebrow">ลงนาม — ฝ่ายปกครอง</div>
              </div>
              <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {isTeacherSignaturesPending && (
                  <div style={{ fontSize: 12.5, padding: "8px 12px", background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)", borderRadius: "var(--radius)", color: "var(--indigo-ink)" }}>
                    <span style={{ fontWeight: 600 }}>รอลงนามพร้อมกัน</span> — หัวหน้าระดับสามารถลงนามได้เช่นกัน เมื่อครบทั้งสองฝ่ายจะส่งต่อ ผอ. อัตโนมัติ
                  </div>
                )}
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                  กดยืนยันเพื่อลงลายเซ็นฝ่ายปกครอง
                </div>
                {me?.signatureUrl && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>
                      ลายเซ็นที่จะใช้ — {me.title.name}{me.firstName} {me.lastName}
                    </div>
                    <div className="sig-display" style={{ height: 100, borderColor: "var(--sage)" }}>
                      <img src={me.signatureUrl} alt="ลายเซ็น" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 8 }} />
                      <span className="sig-name">{me.title.name}{me.firstName} {me.lastName}</span>
                    </div>
                  </div>
                )}
                {!me?.signatureUrl && (
                  <div style={{ fontSize: 12.5, color: "var(--amber)", padding: "8px 12px", background: "var(--amber-wash, #fffbeb)", borderRadius: "var(--radius)" }}>
                    ยังไม่มีลายเซ็นในระบบ — ระบบจะบันทึกโดยไม่มีลายเซ็น
                  </div>
                )}
                {disciplineForwardError && (
                  <div style={{ fontSize: 13, color: "var(--rose)", padding: "8px 12px", background: "var(--rose-wash, #fff0f0)", borderRadius: "var(--radius)" }}>
                    {disciplineForwardError}
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  onClick={handleDisciplineForward}
                  disabled={disciplineForwarding}
                  style={{ background: "var(--sage)", width: "100%", justifyContent: "center" }}
                >
                  {disciplineForwarding ? (
                    <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> กำลังบันทึก...</>
                  ) : (
                    <><Check size={14} /> ยืนยันลงนาม (ฝ่ายปกครอง)</>
                  )}
                </button>
              </div>
            </div>
          )}

          {isApproved ? (
            <div className="ks-card">
              <div className="ks-card-header">
                <div className="eyebrow">STATUS</div>
              </div>
              <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--sage-wash, #f0fdf4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--sage)" }}>
                    <CheckCircle2 size={16} style={{ color: "var(--sage)" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--sage)" }}>อนุมัติแล้ว</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{formatThaiDateTime(record.approvedAt)}</div>
                  </div>
                </div>
                {record.approvedByTeacher && (
                  <div className="info-row" style={{ borderBottom: 0, padding: 0 }}>
                    <span className="info-label">โดย</span>
                    <span className="info-value">
                      {record.approvedByTeacher.title.name}{record.approvedByTeacher.firstName} {record.approvedByTeacher.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : isMyGradeHeadItem ? (
            /* ── Grade head forward panel ── */
            <div className="ks-card">
              <div className="ks-card-header">
                <div className="eyebrow">ลงนาม — หัวหน้าระดับ</div>
              </div>
              <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {isTeacherSignaturesPending && (
                  <div style={{ fontSize: 12.5, padding: "8px 12px", background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)", borderRadius: "var(--radius)", color: "var(--indigo-ink)" }}>
                    <span style={{ fontWeight: 600 }}>รอลงนามพร้อมกัน</span> — ครูฝ่ายปกครองสามารถลงนามได้เช่นกัน เมื่อครบทั้งสองฝ่ายจะส่งต่อ ผอ. อัตโนมัติ
                  </div>
                )}
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                  กดยืนยันเพื่อลงลายเซ็นและส่งต่อรายการนี้ให้ผู้อำนวยการพิจารณาอนุมัติ
                </div>
                {me?.signatureUrl && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>
                      ลายเซ็นที่จะใช้ — {me.title.name}{me.firstName} {me.lastName}
                    </div>
                    <div className="sig-display" style={{ height: 100, borderColor: "var(--sage)" }}>
                      <img src={me.signatureUrl} alt="ลายเซ็น" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 8 }} />
                      <span className="sig-name">{me.title.name}{me.firstName} {me.lastName}</span>
                    </div>
                  </div>
                )}
                {!me?.signatureUrl && (
                  <div style={{ fontSize: 12.5, color: "var(--amber)", padding: "8px 12px", background: "var(--amber-wash, #fffbeb)", borderRadius: "var(--radius)" }}>
                    ยังไม่มีลายเซ็นในระบบ — ระบบจะส่งต่อโดยไม่มีลายเซ็น
                  </div>
                )}
                {forwardError && (
                  <div style={{ fontSize: 13, color: "var(--rose)", padding: "8px 12px", background: "var(--rose-wash, #fff0f0)", borderRadius: "var(--radius)" }}>
                    {forwardError}
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  onClick={handleGradeHeadForward}
                  disabled={forwarding}
                  style={{ background: "var(--sage)", width: "100%", justifyContent: "center" }}
                >
                  {forwarding ? (
                    <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> กำลังส่งต่อ...</>
                  ) : (
                    <><Check size={14} /> ยืนยันและส่งต่อให้ ผอ.</>
                  )}
                </button>
              </div>
            </div>
          ) : (isGradeHeadPending || isDisciplinePending || isTeacherSignaturesPending) ? (
            /* ── Waiting for teacher signatures (viewed by director/others) ── */
            <div className="ks-card">
              <div className="ks-card-header">
                <div className="eyebrow">STATUS</div>
              </div>
              <div className="ks-card-pad" style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                {isTeacherSignaturesPending ? "รายการนี้รอลงลายเซ็นจากทั้ง 2 ฝ่าย" : isGradeHeadPending ? "รายการนี้รอหัวหน้าระดับลงลายเซ็น" : "รายการนี้รอครูฝ่ายปกครองลงลายเซ็น"}
                {record.disciplineTeacher && (isDisciplinePending || isTeacherSignaturesPending) && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: record.disciplineTeacherSignature ? "var(--sage)" : "var(--amber, #f59e0b)", flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>ฝ่ายปกครอง: {record.disciplineTeacher.title.name}{record.disciplineTeacher.firstName} {record.disciplineTeacher.lastName}</span>
                    <span style={{ fontSize: 11, color: record.disciplineTeacherSignature ? "var(--sage)" : "var(--ink-3)" }}>{record.disciplineTeacherSignature ? "✓" : "รอ"}</span>
                  </div>
                )}
                {record.gradeHeadTeacher && (isGradeHeadPending || isTeacherSignaturesPending) && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: record.gradeHeadSignature ? "var(--sage)" : "var(--amber, #f59e0b)", flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>หัวหน้าระดับ: {record.gradeHeadTeacher.title.name}{record.gradeHeadTeacher.firstName} {record.gradeHeadTeacher.lastName}</span>
                    <span style={{ fontSize: 11, color: record.gradeHeadSignature ? "var(--sage)" : "var(--ink-3)" }}>{record.gradeHeadSignature ? "✓" : "รอ"}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (isViceDirectorApprover || isDirectorApprover || isAdminAnyStep || isDelegateActiveStep) ? (
            /* ── รองผอ / ผอ / ADMIN / delegate approve panel ── */
            <div className="ks-card">
                  <div className="ks-card-header">
                    <div className="eyebrow">{isViceStep ? "FORWARD → ผอ." : "APPROVE"}</div>
                  </div>
                  <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {isViceStep && !showConfirm && (
                      <div style={{ fontSize: 12.5, padding: "8px 12px", background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)", borderRadius: "var(--radius)", color: "var(--indigo-ink)" }}>
                        ลงนามเพื่อ<span style={{ fontWeight: 600 }}>ส่งต่อให้ผู้อำนวยการ</span>พิจารณาอนุมัติขั้นสุดท้าย
                      </div>
                    )}
                    {!showConfirm ? (
                      <>
                        {me ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius)" }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--indigo-wash)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <User size={14} style={{ color: "var(--indigo)" }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{approverName}</div>
                              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{approverRoleLabel}</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: "var(--ink-4)" }}>ไม่พบข้อมูลผู้อนุมัติ</div>
                        )}
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowConfirm(true)}
                          disabled={!me}
                          style={{ background: "var(--sage)", width: "100%", justifyContent: "center" }}
                        >
                          <ShieldCheck size={14} /> {isViceStep ? "ลงนามส่งต่อให้ ผอ." : "อนุมัติบันทึกถ้อยคำนี้"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div>
                          {isDelegateApprover && stepPrincipals.length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>
                                เลือกลายเซ็นที่จะใช้ในเอกสาร
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {stepPrincipals.map((p) => {
                                  const pName = `${p.title.name}${p.firstName} ${p.lastName}`
                                  const checked = selectedPrincipalId === p.id
                                  return (
                                    <label
                                      key={p.id}
                                      style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "8px 12px", borderRadius: "var(--radius)", cursor: "pointer",
                                        border: `1px solid ${checked ? "var(--indigo)" : "var(--border)"}`,
                                        background: checked ? "var(--indigo-wash)" : "var(--surface-2)",
                                      }}
                                    >
                                      <input
                                        type="radio"
                                        name="principal"
                                        value={p.id}
                                        checked={checked}
                                        onChange={() => setSelectedPrincipalId(p.id)}
                                        style={{ accentColor: "var(--indigo)" }}
                                      />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{pName}</div>
                                        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{ROLE_LABEL[p.role ?? ""] ?? p.role}</div>
                                      </div>
                                      {p.signatureUrl
                                        ? <img src={p.signatureUrl} alt="sig" style={{ height: 32, maxWidth: 64, objectFit: "contain", opacity: 0.8 }} />
                                        : <span style={{ fontSize: 11, color: "var(--ink-4)" }}>ไม่มีลายเซ็น</span>}
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
                            {isDelegateApprover ? "ลายเซ็นที่จะปรากฏในเอกสาร" : `ลายเซ็นผู้อนุมัติ — ${approverName}`}
                          </div>
                          <div className="sig-display" style={{ height: 120, borderColor: stepSigUrl ? "var(--sage)" : undefined }}>
                            {stepSigUrl
                              ? <img src={stepSigUrl} alt="ลายเซ็น" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 8 }} />
                              : <span style={{ fontSize: 12.5, color: "var(--ink-4)" }}>
                                  {isDelegateApprover && !selectedPrincipalId ? "กรุณาเลือกลายเซ็นด้านบน" : "ยังไม่มีลายเซ็นในระบบ"}
                                </span>}
                            {stepSigName && <span className="sig-name">{stepSigName}</span>}
                          </div>
                        </div>
                        {approveError && (
                          <div style={{ fontSize: 13, color: "var(--rose)", padding: "8px 12px", background: "var(--rose-wash, #fff0f0)", borderRadius: "var(--radius)" }}>
                            {approveError}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <button
                            className="btn btn-primary"
                            onClick={handleApprove}
                            disabled={approving || (isDelegateApprover && !selectedPrincipalId)}
                            style={{ background: "var(--sage)", width: "100%", justifyContent: "center" }}
                          >
                            {approving ? (
                              <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> กำลังบันทึก...</>
                            ) : (
                              <><Check size={14} /> {isViceStep ? "ยืนยันลงนามส่งต่อ" : "บันทึกการอนุมัติ"}</>
                            )}
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => { setShowConfirm(false); setApproveError(null) }}
                            disabled={approving}
                            style={{ width: "100%", justifyContent: "center" }}
                          >
                            <ChevronLeft size={14} /> ย้อนกลับ
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
          ) : (isViceDirectorPending || isDirectorPending) ? (
            /* ── Waiting for director approval (viewed by non-approvers) ── */
            <div className="ks-card">
              <div className="ks-card-header">
                <div className="eyebrow">STATUS</div>
              </div>
              <div className="ks-card-pad" style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                {isViceDirectorPending ? "รายการนี้รอรองผู้อำนวยการลงนาม" : "รายการนี้รอผู้อำนวยการอนุมัติขั้นสุดท้าย"}
              </div>
            </div>
          ) : null}

          {/* Audit */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div className="eyebrow">AUDIT</div>
            </div>
            <div className="ks-card-pad" style={{ fontSize: 13 }}>
              <div className="info-row">
                <span className="info-label">บันทึกวันที่</span>
                <span className="info-value mono">{formatThaiDate(record.recordDate)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">ผู้บันทึก</span>
                <span className="info-value">{record.recordedBy}</span>
              </div>
              <div className="info-row" style={{ borderBottom: 0 }}>
                <span className="info-label">สถานะ</span>
                <span className={`chip ${isApproved ? "chip-approved" : "chip-pending"}`} style={{ fontSize: 11 }}>
                  {isApproved ? "อนุมัติแล้ว"
                    : isTeacherSignaturesPending ? "รอลงนาม 2 ฝ่าย"
                    : isDisciplinePending ? "รอฝ่ายปกครอง"
                    : isGradeHeadPending ? "รอหัวหน้าระดับ"
                    : isViceDirectorPending ? "รอรองผอ."
                    : isDirectorPending ? "รอผอ."
                    : "รออนุมัติ"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared UI ──────────────────────────────────────────────────────────────────

function SigBox({ label, dataUrl }: { label: string; dataUrl: string | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", letterSpacing: "0.06em", color: "var(--ink-3)", textTransform: "uppercase" }}>
        {label}
      </div>
      <div className="sig-display" style={{ borderColor: dataUrl ? "var(--sage)" : undefined, background: dataUrl ? "var(--sage-wash, #f0fdf4)" : undefined }}>
        {dataUrl
          ? <img src={dataUrl} alt="signature" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
          : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ไม่มีลายเซ็น</span>}
      </div>
    </div>
  )
}
