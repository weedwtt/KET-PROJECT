"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Pencil, Check, Download, FileText } from "lucide-react"

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
  approvedByTeacher: { id: number; firstName: string; lastName: string; signatureUrl: string | null; title: { name: string } } | null
  signatureTeacher: { id: number; firstName: string; lastName: string; signatureUrl: string | null; title: { name: string } } | null
}

type Approver = { id: number; firstName: string; lastName: string; role: string | null; title: { name: string } }

const CONSIDERATION_LABELS: Record<string, string> = {
  notify_parent: "แจ้งผู้ปกครองทราบ",
  invite_parent: "เชิญผู้ปกครองมาพบ",
}
const RESULT_LABELS: Record<string, string> = {
  verbal_warning: "ตักเตือนด้วยวาจา",
  deduct_score: "ตัดคะแนนความประพฤติ",
  behavior_activity: "ทำกิจกรรมพัฒนาพฤติกรรม",
  probation_bond: "ทำสัญญาทัณฑ์บน",
}
const PENALTY_LABELS: Record<string, string> = {
  deduct_score: "ตัดคะแนน",
  behavior_camp: "ค่ายพัฒนาพฤติกรรม",
  suspension: "พักการเรียน",
  transfer: "ส่งต่อ",
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
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543} · ${time} น.`
}

export default function StatementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [record, setRecord] = useState<StatementDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [selectedApproverId, setSelectedApproverId] = useState("")
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [disciplineApproving, setDisciplineApproving] = useState(false)
  const [disciplineApproveError, setDisciplineApproveError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/statements/${id}`).then((r) => r.json()),
      fetch("/api/teachers/approvers").then((r) => r.json()),
    ]).then(([rec, apv]) => {
      setRecord(rec); setApprovers(apv); setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  async function handleDisciplineApprove() {
    setDisciplineApproving(true); setDisciplineApproveError(null)
    try {
      const res = await fetch(`/api/statements/${id}/discipline-approve`, { method: "POST" })
      if (!res.ok) { const err = await res.json(); setDisciplineApproveError(err.error ?? "เกิดข้อผิดพลาด"); return }
      const updated = await fetch(`/api/statements/${id}`).then((r) => r.json())
      setRecord(updated)
    } catch { setDisciplineApproveError("เกิดข้อผิดพลาดในการเชื่อมต่อ") }
    finally { setDisciplineApproving(false) }
  }

  async function handleApprove() {
    if (!selectedApproverId) return
    setApproving(true); setApproveError(null)
    try {
      const res = await fetch(`/api/statements/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: Number(selectedApproverId) }),
      })
      if (!res.ok) { const err = await res.json(); setApproveError(err.error ?? "เกิดข้อผิดพลาด"); return }
      router.refresh()
      const updated = await fetch(`/api/statements/${id}`).then((r) => r.json())
      setRecord(updated)
    } catch { setApproveError("เกิดข้อผิดพลาดในการเชื่อมต่อ") }
    finally { setApproving(false) }
  }

  if (loading) return (
    <div className="ks-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <div style={{ color: "var(--ink-3)" }}>กำลังโหลด...</div>
    </div>
  )

  if (!record) return (
    <div className="ks-page empty-state">ไม่พบรายการ</div>
  )

  const isApproved = record.status === "approved"
  const advisor1 = record.student.advisors.find((a) => a.slot === 1)?.teacher
  const advisor2 = record.student.advisors.find((a) => a.slot === 2)?.teacher
  const advisorNames = [advisor1, advisor2].filter(Boolean).map((t) => `${t!.title?.name ?? ""}${t!.firstName} ${t!.lastName}`).join(" | ") || "—"
  const showGuardianSig = !(record.considerationMeasures.includes("notify_parent") && !record.considerationMeasures.includes("invite_parent"))

  return (
    <div className="ks-page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            
            <span>#{record.id} · {formatThaiDate(record.recordDate)}</span>
          </div>
          <h1>บันทึกถ้อยคำ — {record.student.title?.name}{record.student.firstName} {record.student.lastName}</h1>
        </div>
        <div className="page-actions">
          <Link href="/record/statement" className="btn btn-ghost">
            <ChevronLeft size={14} />ย้อนกลับ
          </Link>
          {!isApproved && (
            <Link href={`/record/statement/${id}/edit`} className="btn btn-secondary">
              <Pencil size={14} />แก้ไข
            </Link>
          )}
          <a href={`/api/statements/${id}/export-pdf`} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
            <FileText size={14} />Export PDF
          </a>
        </div>
      </div>

      <div className="detail-grid">
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>

          {/* 01 Student */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>01 · STUDENT</div>
                <div className="ks-card-title">ข้อมูลนักเรียน</div>
              </div>
              <span className={`chip chip-${isApproved ? "approved" : "pending"}`}>
                {isApproved ? "อนุมัติแล้ว" : "รออนุมัติ"}
              </span>
            </div>
            <div style={{ padding: "0 24px" }}>
              <div style={{ display: "flex", gap: 18, padding: "20px 0", borderBottom: "1px solid var(--rule)" }}>
                <div style={{ width: 60, height: 78, background: "var(--paper-2)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--ink-3)", fontFamily: "var(--font-mono)", border: "1px solid var(--rule)", flexShrink: 0 }}>2.5×3.5</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    STUDENT ID · {record.student.studentCode}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, margin: "4px 0 2px", letterSpacing: "-0.005em" }}>
                    {record.student.title?.name}{record.student.firstName} {record.student.lastName}
                  </div>
                  <div style={{ color: "var(--ink-2)", fontSize: 13 }}>
                    ชั้น {record.student.gradeLevel}/{record.student.classRoom} · เลขที่ {record.student.classNumber}
                  </div>
                </div>
              </div>
              {record.student.guardians[0] && (
                <InfoRow label="ผู้ปกครอง" value={`${record.student.guardians[0].firstName} ${record.student.guardians[0].lastName}`} />
              )}
              {(advisor1 || advisor2) && (
                <InfoRow label="ครูที่ปรึกษา" value={advisorNames} />
              )}
              <InfoRow label="ภาคเรียน / ปีการศึกษา" value={`${record.semester.name} / ${record.academicYear.year}`} />
            </div>
          </div>

          {/* 02 Incident */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>02 · INCIDENT</div>
                <div className="ks-card-title">รายละเอียดการกระทำผิด</div>
              </div>
            </div>
            <div style={{ padding: "0 24px 18px" }}>
              <InfoRow label="หมวดการผิดระเบียบ" value={record.violationCategory.name} />
              <InfoRow label="วัน-เวลาที่เกิดเหตุ" value={formatThaiDateTime(record.incidentAt)} mono />
              <InfoRow label="สถานที่เกิดเหตุ" value={record.location ?? "—"} />
              <InfoRow label="ผู้บันทึก" value={record.recordedBy ?? "—"} />
              {record.subject && <InfoRow label="เรื่อง" value={record.subject} />}
              {record.content && (
                <div style={{ paddingTop: 16, marginTop: 6, borderTop: "1px solid var(--rule-soft)" }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>รายละเอียดพฤติกรรม</div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--ink)" }}>{record.content}</p>
                </div>
              )}
            </div>
          </div>

          {/* 03 Measures */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>03 · MEASURES</div>
                <div className="ks-card-title">มาตรการที่กำหนด</div>
              </div>
            </div>
            <div style={{ padding: 22 }}>
              {record.considerationMeasures.length > 0 && (
                <>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>มาตรการพิจารณา</div>
                  <div style={{ marginBottom: 18 }}>
                    {record.considerationMeasures.map((m) => (
                      <span key={m} className="measure-tag"><span className="dot" />{CONSIDERATION_LABELS[m] ?? m}</span>
                    ))}
                  </div>
                </>
              )}
              {record.resultMeasures.length > 0 && (
                <>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>มาตรการผลการพิจารณา</div>
                  <div style={{ marginBottom: 18 }}>
                    {record.resultMeasures.map((m) => (
                      <span key={m} className="measure-tag"><span className="dot" />{RESULT_LABELS[m] ?? m}</span>
                    ))}
                  </div>
                </>
              )}
              {record.bond?.penaltyActions && record.bond.penaltyActions.length > 0 && (
                <>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>มาตรการโทษ</div>
                  <div style={{ marginBottom: 18 }}>
                    {record.bond.penaltyActions.map((m) => (
                      <span key={m} className="measure-tag"><span className="dot" />{PENALTY_LABELS[m] ?? m}</span>
                    ))}
                  </div>
                </>
              )}
              {record.measureNotes && (
                <>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>หมายเหตุ</div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--ink-2)" }}>{record.measureNotes}</p>
                </>
              )}
            </div>
          </div>

          {/* 04 Signatures */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>04 · SIGNATURES</div>
                <div className="ks-card-title">ลายเซ็น</div>
              </div>
            </div>
            <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Row 1: นักเรียน · [ผู้ปกครอง] · ครูที่ปรึกษา */}
              <div style={{ display: "grid", gridTemplateColumns: showGuardianSig ? "1fr 1fr 1fr" : "1fr 1fr", gap: 14 }}>
                {[
                  { label: "นักเรียน", name: `${record.student.title?.name}${record.student.firstName} ${record.student.lastName}`, url: record.studentSignature },
                  ...(showGuardianSig ? [{ label: "ผู้ปกครอง", name: record.student.guardians[0] ? `${record.student.guardians[0].firstName} ${record.student.guardians[0].lastName}` : "", url: record.guardianSignature }] : []),
                  { label: "ครูที่ปรึกษา", name: advisorNames, url: record.advisorSignature },
                ].map((s) => (
                  <SigDisplayBox key={s.label} label={s.label} name={s.name} url={s.url} date={record.recordDate} />
                ))}
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid var(--rule-soft)" }} />

              {/* Row 2: ครูฝ่ายปกครอง · หัวหน้าระดับชั้น */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <SigDisplayBox
                  label="ครูฝ่ายปกครอง"
                  name={record.disciplineTeacher ? `${record.disciplineTeacher.title?.name}${record.disciplineTeacher.firstName} ${record.disciplineTeacher.lastName}` : ""}
                  url={record.disciplineTeacherSignature ?? record.disciplineTeacher?.signatureUrl ?? null}
                  date={record.recordDate}
                  isLive={!!record.disciplineTeacherSignature}
                />
                <SigDisplayBox
                  label="หัวหน้าระดับชั้น"
                  name={record.gradeHeadTeacher ? `${record.gradeHeadTeacher.title?.name}${record.gradeHeadTeacher.firstName} ${record.gradeHeadTeacher.lastName}` : ""}
                  url={record.gradeHeadSignature ?? record.gradeHeadTeacher?.signatureUrl ?? null}
                  date={record.recordDate}
                  isLive={!!record.gradeHeadSignature}
                />
              </div>
            </div>
          </div>

          {/* 05 Bond (conditional) */}
          {record.bond && (
            <div className="ks-card">
              <div className="ks-card-header">
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>05 · BOND</div>
                  <div className="ks-card-title">สัญญาทัณฑ์บน</div>
                </div>
              </div>
              <div style={{ padding: "0 24px 22px" }}>
                {record.bond.witnessName && <InfoRow label="พยาน" value={record.bond.witnessName} />}
                {record.bond.deductPoints && <InfoRow label="ตัดคะแนน" value={`${record.bond.deductPoints} คะแนน`} />}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)", position: "sticky", top: 16 }}>

          {/* Parallel signatures pending card */}
          {record.status === "pending_teacher_signatures" && (
            <div className="ks-card ks-card-pad" style={{ border: "1px solid var(--periwinkle)", background: "var(--indigo-wash)" }}>
              <div className="eyebrow" style={{ marginBottom: 12, color: "var(--indigo)" }}>รอลงนาม (ทั้งสองฝ่าย)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* ฝ่ายปกครอง */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: record.disciplineTeacherSignature ? "var(--sage)" : "var(--amber, #f59e0b)",
                  }} />
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>ฝ่ายปกครอง</span>
                    {record.disciplineTeacher && (
                      <span style={{ color: "var(--ink-3)", marginLeft: 6 }}>
                        {record.disciplineTeacher.title?.name}{record.disciplineTeacher.firstName} {record.disciplineTeacher.lastName}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: record.disciplineTeacherSignature ? "var(--sage)" : "var(--ink-3)" }}>
                    {record.disciplineTeacherSignature ? "✓ ลงนามแล้ว" : "รอลงนาม"}
                  </span>
                </div>
                {/* หัวหน้าระดับ */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: record.gradeHeadSignature ? "var(--sage)" : "var(--amber, #f59e0b)",
                  }} />
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>หัวหน้าระดับ</span>
                    {record.gradeHeadTeacher && (
                      <span style={{ color: "var(--ink-3)", marginLeft: 6 }}>
                        {record.gradeHeadTeacher.title?.name}{record.gradeHeadTeacher.firstName} {record.gradeHeadTeacher.lastName}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: record.gradeHeadSignature ? "var(--sage)" : "var(--ink-3)" }}>
                    {record.gradeHeadSignature ? "✓ ลงนามแล้ว" : "รอลงนาม"}
                  </span>
                </div>
              </div>
              {/* ปุ่มสำหรับฝ่ายปกครอง (แสดงเมื่อยังไม่ลงนาม) */}
              {!record.disciplineTeacherSignature && (
                <div style={{ marginTop: 14 }}>
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                    onClick={handleDisciplineApprove}
                    disabled={disciplineApproving}
                  >
                    {disciplineApproving ? "กำลังดำเนินการ..." : "ยืนยันลงนาม (ฝ่ายปกครอง)"}
                  </button>
                  {disciplineApproveError && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--rose)" }}>{disciplineApproveError}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Discipline-only pending card */}
          {record.status === "pending_discipline_teacher" && (
            <div className="ks-card ks-card-pad" style={{ border: "1px solid var(--periwinkle)", background: "var(--indigo-wash)" }}>
              <div className="eyebrow" style={{ marginBottom: 10, color: "var(--indigo)" }}>รอครูฝ่ายปกครองลงนาม</div>
              {record.disciplineTeacher && (
                <div style={{ fontSize: 13, marginBottom: 12, color: "var(--ink-2)" }}>
                  {record.disciplineTeacher.title?.name}{record.disciplineTeacher.firstName} {record.disciplineTeacher.lastName}
                </div>
              )}
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleDisciplineApprove}
                disabled={disciplineApproving}
              >
                {disciplineApproving ? "กำลังดำเนินการ..." : "ยืนยันลงนาม (ฝ่ายปกครอง)"}
              </button>
              {disciplineApproveError && (
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--rose)" }}>{disciplineApproveError}</div>
              )}
            </div>
          )}

          {/* Approved info */}
          {isApproved && (
            <div className="ks-card ks-card-pad" style={{ background: "var(--sage-soft)" }}>
              <div className="eyebrow" style={{ marginBottom: 12, color: "var(--sage)" }}>อนุมัติแล้ว</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                {record.approvedByTeacher?.title?.name}{record.approvedByTeacher?.firstName} {record.approvedByTeacher?.lastName}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                {formatThaiDateTime(record.approvedAt)}
              </div>
              {(record.signatureTeacher ?? record.approvedByTeacher)?.signatureUrl && (() => {
                const sigT = record.signatureTeacher ?? record.approvedByTeacher!
                return (
                  <div className="sig-display" style={{ marginTop: 14, borderColor: "var(--sage)", background: "var(--sage-wash, #f0fdf4)" }}>
                    <img src={sigT.signatureUrl!} alt="ลายเซ็นผู้อนุมัติ" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                    <div className="sig-name">{sigT.title?.name}{sigT.firstName} {sigT.lastName}</div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Audit */}
          <div className="ks-card ks-card-pad">
            <div className="eyebrow" style={{ marginBottom: 12 }}>AUDIT</div>
            <InfoRow label="ID" value={String(record.id)} mono />
            <InfoRow label="สร้างเมื่อ" value={formatThaiDate(record.recordDate)} mono />
          </div>
        </div>
      </div>
    </div>
  )
}

function SigDisplayBox({ label, name, url, date, isLive }: {
  label: string; name: string; url: string | null; date: string; isLive?: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>§ {label}</span>
        {isLive && (
          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "var(--indigo-wash)", color: "var(--indigo)", fontWeight: 500 }}>เซ็นสด</span>
        )}
      </div>
      <div className="sig-display" style={{ borderColor: url ? "var(--sage)" : undefined, background: url ? "var(--sage-wash, #f0fdf4)" : undefined }}>
        {url
          ? <img src={url} alt="signature" style={{ maxHeight: "80%", maxWidth: "100%", objectFit: "contain" }} />
          : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ไม่มีลายเซ็น</span>
        }
        <div className="sig-name">{label}</div>
      </div>
      {name && <div style={{ fontSize: 12.5, marginTop: 8, fontWeight: 500 }}>{name}</div>}
      <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{formatThaiDate(date)}</div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${mono ? "mono" : ""}`}>{value || "—"}</span>
    </div>
  )
}
