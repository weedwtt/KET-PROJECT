"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Pencil, Check, Download, FileText } from "lucide-react"

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

  useEffect(() => {
    Promise.all([
      fetch(`/api/statements/${id}`).then((r) => r.json()),
      fetch("/api/teachers/approvers").then((r) => r.json()),
    ]).then(([rec, apv]) => {
      setRecord(rec); setApprovers(apv); setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

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

  return (
    <div className="ks-page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span className="num">§03</span>
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
          <a href={`/api/statements/${id}/export-word`} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
            <FileText size={14} />ดาวน์โหลด Word
          </a>
        </div>
      </div>

      <div className="detail-grid">
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>

          {/* § 01 Student */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>§ 01 · STUDENT</div>
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
              {advisor1 && (
                <InfoRow label="ครูที่ปรึกษา" value={`${advisor1.title?.name}${advisor1.firstName} ${advisor1.lastName}`} />
              )}
              <InfoRow label="ภาคเรียน / ปีการศึกษา" value={`${record.semester.name} / ${record.academicYear.year}`} />
            </div>
          </div>

          {/* § 02 Incident */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>§ 02 · INCIDENT</div>
                <div className="ks-card-title">รายละเอียดการกระทำผิด</div>
              </div>
            </div>
            <div style={{ padding: "0 24px 18px" }}>
              <InfoRow label="หมวดการผิดระเบียบ" value={record.violationCategory.name} />
              <InfoRow label="วัน-เวลาที่เกิดเหตุ" value={formatThaiDateTime(record.incidentAt)} mono />
              <InfoRow label="สถานที่เกิดเหตุ" value={record.location ?? "—"} />
              <InfoRow label="ผู้บันทึก" value={record.recordedBy} />
              {record.subject && <InfoRow label="เรื่อง" value={record.subject} />}
              {record.content && (
                <div style={{ paddingTop: 16, marginTop: 6, borderTop: "1px solid var(--rule-soft)" }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>รายละเอียดพฤติกรรม</div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--ink)" }}>{record.content}</p>
                </div>
              )}
            </div>
          </div>

          {/* § 03 Measures */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>§ 03 · MEASURES</div>
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

          {/* § 04 Signatures */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>§ 04 · SIGNATURES</div>
                <div className="ks-card-title">ลายเซ็น</div>
              </div>
            </div>
            <div className="ks-card-pad" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {[
                { label: "นักเรียน", name: `${record.student.title?.name}${record.student.firstName} ${record.student.lastName}`, url: record.studentSignature },
                { label: "ผู้ปกครอง", name: record.student.guardians[0] ? `${record.student.guardians[0].firstName} ${record.student.guardians[0].lastName}` : "—", url: record.guardianSignature },
                { label: "ครูที่ปรึกษา", name: advisor1 ? `${advisor1.title?.name}${advisor1.firstName} ${advisor1.lastName}` : "—", url: record.advisorSignature },
              ].map((s) => (
                <div key={s.label}>
                  <div className="sig-display">
                    {s.url
                      ? <img src={s.url} alt="signature" style={{ height: "80%", objectFit: "contain" }} />
                      : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ไม่มีลายเซ็น</span>
                    }
                    <div className="sig-name">{s.label}</div>
                  </div>
                  <div style={{ fontSize: 12.5, marginTop: 8 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{formatThaiDate(record.recordDate)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* § 05 Bond (conditional) */}
          {record.bond && (
            <div className="ks-card">
              <div className="ks-card-header">
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>§ 05 · BOND</div>
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
          {/* Send for approval */}
          {!isApproved && (
            <div className="ks-card ks-card-pad" style={{ background: "var(--surface-2)" }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>§ ส่งอนุมัติ</div>
              <label className="field-label">เลือกผู้พิจารณาอนุมัติ</label>
              <select
                className="ks-select"
                value={selectedApproverId}
                onChange={(e) => setSelectedApproverId(e.target.value)}
              >
                <option value="">— เลือกผู้อนุมัติ —</option>
                {approvers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title?.name}{t.firstName} {t.lastName}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 14, justifyContent: "center", opacity: (!selectedApproverId || approving) ? 0.5 : 1 }}
                disabled={!selectedApproverId || approving}
                onClick={handleApprove}
              >
                {approving ? "กำลังส่ง..." : "ส่งเพื่อพิจารณาอนุมัติ"}
              </button>
              {approveError && (
                <p style={{ marginTop: 10, fontSize: 12, color: "var(--rose)" }}>{approveError}</p>
              )}
              <p style={{ marginTop: 12, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.55 }}>
                เมื่อส่งแล้ว ผู้พิจารณาจะได้รับแจ้งเตือนทันที และไม่สามารถแก้ไขบันทึกได้จนกว่าจะมีการตีคืน
              </p>
            </div>
          )}

          {/* Approved info */}
          {isApproved && (
            <div className="ks-card ks-card-pad" style={{ background: "var(--sage-soft)" }}>
              <div className="eyebrow" style={{ marginBottom: 12, color: "var(--sage)" }}>§ อนุมัติแล้ว</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                {record.approvedByTeacher?.title?.name}{record.approvedByTeacher?.firstName} {record.approvedByTeacher?.lastName}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                {formatThaiDateTime(record.approvedAt)}
              </div>
            </div>
          )}

          {/* Audit */}
          <div className="ks-card ks-card-pad">
            <div className="eyebrow" style={{ marginBottom: 12 }}>§ AUDIT</div>
            <InfoRow label="ID" value={String(record.id)} mono />
            <InfoRow label="สร้างเมื่อ" value={formatThaiDate(record.recordDate)} mono />
          </div>
        </div>
      </div>
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
