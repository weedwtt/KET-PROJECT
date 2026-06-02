"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Check, ShieldCheck, User, UserCheck } from "lucide-react"

type BondDetail = {
  id: number
  contractDate: string
  guardianName: string
  guardianRelation: string
  guardianPhone: string | null
  violationDetail: string
  recorder: string
  measureDeductScore: boolean
  measureDeductPoints: number | null
  measureActivity: boolean
  measureSuspension: boolean
  measureTransfer: boolean
  guardianSignature: string | null
  studentSignature: string | null
  advisorSignature: string | null
  headTeacherSignature: string | null
  viceDirectorSignature: string | null
  directorSignature: string | null
  headTeacher: { id: number; firstName: string; lastName: string; title: { name: string }; signatureUrl: string | null } | null
  disciplineTeacher: { id: number; firstName: string; lastName: string; title: { name: string }; signatureUrl: string | null } | null
  disciplineTeacherSignature: string | null
  student: {
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    classNumber: number
    title: { name: string }
  }
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
  signatureUrl: string | null
  title: { name: string }
  delegateFor: { principal: DelegatePrincipal }[]
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

export default function BondApproveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [record, setRecord] = useState<BondDetail | null>(null)
  const [me, setMe] = useState<MyTeacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<number | null>(null)
  const [disciplineSigning, setDisciplineSigning] = useState(false)
  const [disciplineSignError, setDisciplineSignError] = useState<string | null>(null)
  const [headTeacherSigning, setHeadTeacherSigning] = useState(false)
  const [headTeacherSignError, setHeadTeacherSignError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setFetchError(null)

    const bondFetch = fetch(`/api/bonds/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.error) { setFetchError(data.error); return }
        setRecord(data)
      })
      .catch(() => setFetchError("โหลดข้อมูลไม่สำเร็จ"))

    const meFetch = fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setMe(data))
      .catch(() => {})

    Promise.all([bondFetch, meFetch]).finally(() => setLoading(false))
  }, [id])

  async function handleSign() {
    if (!me) return
    setSigning(true); setSignError(null)

    const signingPrincipal = isDelegateApprover
      ? (me.delegateFor?.find((d) => d.principal.id === selectedPrincipalId)?.principal ?? null)
      : null

    const effectiveRole = signingPrincipal?.role ?? me.role
    const effectiveSig = signingPrincipal?.signatureUrl ?? me.signatureUrl
    // Route to correct field based on current turn (not just role, so ADMIN goes to the right field)
    const sigField = isDirectorTurn ? "directorSignature" : "viceDirectorSignature"

    try {
      const res = await fetch(`/api/bonds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [sigField]: effectiveSig ?? "signed",
          approvedByTeacherId: me.id,
          approvedAt: new Date().toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setSignError(err.error ?? "เกิดข้อผิดพลาด")
        return
      }
      router.push("/dashboard/approve")
    } catch {
      setSignError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setSigning(false)
    }
  }

  async function handleDisciplineSign() {
    setDisciplineSigning(true)
    setDisciplineSignError(null)
    try {
      const res = await fetch(`/api/bonds/${id}/discipline-approve`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        setDisciplineSignError(err.error ?? "เกิดข้อผิดพลาด")
        return
      }
      router.push("/dashboard/approve")
    } catch {
      setDisciplineSignError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setDisciplineSigning(false)
    }
  }

  async function handleHeadTeacherSign() {
    setHeadTeacherSigning(true)
    setHeadTeacherSignError(null)
    try {
      const res = await fetch(`/api/bonds/${id}/head-teacher-approve`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        setHeadTeacherSignError(err.error ?? "เกิดข้อผิดพลาด")
        return
      }
      router.push("/dashboard/approve")
    } catch {
      setHeadTeacherSignError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setHeadTeacherSigning(false)
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

  if (fetchError) return (
    <div className="ks-page" style={{ textAlign: "center", color: "var(--rose)" }}>{fetchError}</div>
  )

  if (!record) return (
    <div className="ks-page" style={{ textAlign: "center", color: "var(--ink-3)" }}>ไม่พบรายการ</div>
  )

  const isSigned = !!(record.directorSignature)
  const approverName = me ? `${me.title.name}${me.firstName} ${me.lastName}` : ""
  const isMyDisciplineItem = !!(
    me &&
    record.disciplineTeacher?.id === me.id &&
    !record.disciplineTeacherSignature
  )
  const isMyHeadTeacherItem = !!(
    me &&
    record.headTeacher?.id === me.id &&
    !record.headTeacherSignature
  )

  const isDelegateApprover = (me?.delegateFor?.length ?? 0) > 0
  const principals = me?.delegateFor?.map((d) => d.principal) ?? []
  const approverRoleLabel = isDelegateApprover
    ? "ผู้รับมอบอำนาจ"
    : ROLE_LABEL[me?.role ?? ""] ?? me?.role ?? ""

  // Sequential signing: รองผอ ก่อน → ผอ
  // รองผอ: ลงนามได้เมื่อ viceDirectorSignature ยังไม่มี
  const isViceDirectorTurn = !record.viceDirectorSignature && !record.directorSignature
  // ผอ: ลงนามได้เมื่อ รองผอ ลงนามแล้ว
  const isDirectorTurn = !!record.viceDirectorSignature && !record.directorSignature

  const myRole = me?.role
  const canViceDirectorSign = (myRole === "VICE_DIRECTOR" || myRole === "ADMIN") && isViceDirectorTurn
  const canDirectorSignNow = (myRole === "DIRECTOR" || myRole === "ADMIN") && isDirectorTurn

  // Delegate: check which step they can act on based on principal role
  const viceDirectorPrincipals = principals.filter((p) => p.role === "VICE_DIRECTOR" || p.role === "ADMIN")
  const directorPrincipals = principals.filter((p) => p.role === "DIRECTOR" || p.role === "ADMIN")
  const canDelegateViceSign = isDelegateApprover && viceDirectorPrincipals.length > 0 && isViceDirectorTurn
  const canDelegateDirectorSign = isDelegateApprover && directorPrincipals.length > 0 && isDirectorTurn

  const canDirectorSign = canViceDirectorSign || canDirectorSignNow || canDelegateViceSign || canDelegateDirectorSign
  // Which principals to show in the confirm panel
  const activePrincipals = isViceDirectorTurn ? viceDirectorPrincipals : directorPrincipals

  const selectedPrincipal = principals.find((p) => p.id === selectedPrincipalId) ?? null
  const sigUrl = isDelegateApprover ? selectedPrincipal?.signatureUrl ?? null : me?.signatureUrl ?? null
  const sigName = isDelegateApprover && selectedPrincipal
    ? `${selectedPrincipal.title.name}${selectedPrincipal.firstName} ${selectedPrincipal.lastName}`
    : approverName

  const measures: string[] = []
  if (record.measureDeductScore) measures.push(`ตัดคะแนน${record.measureDeductPoints ? ` ${record.measureDeductPoints} คะแนน` : ""}`)
  if (record.measureActivity) measures.push("กิจกรรมค่ายปรับพฤติกรรม")
  if (record.measureSuspension) measures.push("พักการเรียน")
  if (record.measureTransfer) measures.push("ย้ายสถานศึกษา")

  return (
    <div className="ks-page" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard/approve" className="btn btn-ghost btn-sm btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="page-eyebrow"><span>ฝ่ายปกครอง · ทัณฑ์บน #{record.id}</span></div>
            <h1>รายละเอียดบันทึกทัณฑ์บน</h1>
          </div>
        </div>
        <span className={`chip ${isSigned ? "chip-approved" : "chip-pending"}`}>
          {isSigned ? "อนุมัติแล้ว"
            : isViceDirectorTurn ? "รอรองผอ."
            : isDirectorTurn ? "รอผอ."
            : "รออนุมัติ"}
        </span>
      </div>

      <div className="detail-grid">
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

          {/* Contract info */}
          <div className="ks-card">
            <div className="ks-card-header"><div className="eyebrow">02 · CONTRACT</div></div>
            <div className="ks-card-pad">
              <div className="info-row">
                <span className="info-label">วันที่ทำสัญญา</span>
                <span className="info-value">{formatThaiDate(record.contractDate)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">ผู้ปกครอง</span>
                <span className="info-value">{record.guardianName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">ความสัมพันธ์</span>
                <span className="info-value">{record.guardianRelation || "—"}</span>
              </div>
              {record.guardianPhone && (
                <div className="info-row">
                  <span className="info-label">โทรศัพท์</span>
                  <span className="info-value mono">{record.guardianPhone}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">ผู้บันทึก</span>
                <span className="info-value">{record.recorder}</span>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>รายละเอียดความผิด</div>
                <div style={{ fontSize: 13.5, padding: "10px 14px", background: "var(--surface-2)", borderRadius: "var(--radius)", lineHeight: 1.7 }}>
                  {record.violationDetail}
                </div>
              </div>
            </div>
          </div>

          {/* Measures */}
          {measures.length > 0 && (
            <div className="ks-card">
              <div className="ks-card-header"><div className="eyebrow">03 · MEASURES</div></div>
              <div className="ks-card-pad">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {measures.map((m) => (
                    <span key={m} className="measure-tag"><span className="dot" /> {m}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="ks-card">
            <div className="ks-card-header"><div className="eyebrow">04 · SIGNATURES</div></div>
            <div className="ks-card-pad">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <SigBox label="ผู้ปกครอง" dataUrl={record.guardianSignature} />
                <SigBox label="นักเรียน" dataUrl={record.studentSignature} />
                <SigBox label="ครูที่ปรึกษา" dataUrl={record.advisorSignature} />
              </div>
              {(record.headTeacher || record.disciplineTeacher) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                  {record.headTeacher && (
                    <SigBox
                      label={`หัวหน้าระดับ — ${record.headTeacher.title.name}${record.headTeacher.firstName} ${record.headTeacher.lastName}`}
                      dataUrl={record.headTeacherSignature ?? record.headTeacher.signatureUrl}
                    />
                  )}
                  {record.disciplineTeacher && (
                    <SigBox
                      label={`ครูฝ่ายปกครอง — ${record.disciplineTeacher.title.name}${record.disciplineTeacher.firstName} ${record.disciplineTeacher.lastName}`}
                      dataUrl={record.disciplineTeacherSignature ?? record.disciplineTeacher.signatureUrl}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: "var(--gap)" }}>

          {/* Discipline teacher signing panel */}
          {isMyDisciplineItem && (
            <div className="ks-card">
              <div className="ks-card-header"><div className="eyebrow">ลงนาม · ครูฝ่ายปกครอง</div></div>
              <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  คุณถูกระบุเป็นครูฝ่ายปกครองในสัญญาทัณฑ์บนนี้ กรุณาพิจารณาและลงนามเพื่อส่งต่อ
                </div>
                {me?.signatureUrl && (
                  <div className="sig-display" style={{ borderColor: "var(--sage)" }}>
                    <img src={me.signatureUrl} alt="ลายเซ็น" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 8 }} />
                    <span className="sig-name">{approverName}</span>
                  </div>
                )}
                {disciplineSignError && (
                  <div style={{ fontSize: 13, color: "var(--rose)", padding: "8px 12px", background: "var(--rose-wash, #fff0f0)", borderRadius: "var(--radius)" }}>
                    {disciplineSignError}
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  onClick={handleDisciplineSign}
                  disabled={disciplineSigning}
                  style={{ background: "var(--sage)", width: "100%", justifyContent: "center" }}
                >
                  {disciplineSigning
                    ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> กำลังบันทึก...</>
                    : <><Check size={14} /> ลงนามฝ่ายปกครอง</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Head teacher signing panel */}
          {isMyHeadTeacherItem && (
            <div className="ks-card">
              <div className="ks-card-header"><div className="eyebrow">ลงนาม · หัวหน้าระดับ</div></div>
              <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  คุณถูกระบุเป็นหัวหน้าระดับในสัญญาทัณฑ์บนนี้ กรุณาพิจารณาและลงนาม
                </div>
                {me?.signatureUrl && (
                  <div className="sig-display" style={{ borderColor: "var(--sage)" }}>
                    <img src={me.signatureUrl} alt="ลายเซ็น" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 8 }} />
                    <span className="sig-name">{approverName}</span>
                  </div>
                )}
                {headTeacherSignError && (
                  <div style={{ fontSize: 13, color: "var(--rose)", padding: "8px 12px", background: "var(--rose-wash, #fff0f0)", borderRadius: "var(--radius)" }}>
                    {headTeacherSignError}
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  onClick={handleHeadTeacherSign}
                  disabled={headTeacherSigning}
                  style={{ background: "var(--sage)", width: "100%", justifyContent: "center" }}
                >
                  {headTeacherSigning
                    ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> กำลังบันทึก...</>
                    : <><Check size={14} /> ลงนามหัวหน้าระดับ</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Delegate notice */}
          {isDelegateApprover && !isSigned && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px", borderRadius: "var(--radius)",
              background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)",
            }}>
              <UserCheck size={15} style={{ color: "var(--indigo)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--indigo)", marginBottom: 2 }}>อนุมัติในนาม</div>
                <div style={{ fontSize: 12, color: "var(--indigo-ink)", lineHeight: 1.5 }}>
                  {principals.map((p) => `${p.title.name}${p.firstName} ${p.lastName}`).join(" / ")}
                </div>
              </div>
            </div>
          )}

          {isSigned ? (
            <div className="ks-card">
              <div className="ks-card-header"><div className="eyebrow">STATUS</div></div>
              <div className="ks-card-pad">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--sage-wash)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--sage)" }}>
                    <Check size={16} style={{ color: "var(--sage)" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--sage)" }}>ลงนามแล้ว</div>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <SigBox label="รองผู้อำนวยการ" dataUrl={record.viceDirectorSignature} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <SigBox label="ผู้อำนวยการ" dataUrl={record.directorSignature} />
                </div>
              </div>
            </div>
          ) : canDirectorSign ? (
            /* ── รองผอ/ผอ sign panel ── */
            (() => {
              const isViceStep = isViceDirectorTurn
              const activeSelectedPrincipal = activePrincipals.find((p) => p.id === selectedPrincipalId) ?? null
              const activeSigUrl = isDelegateApprover ? activeSelectedPrincipal?.signatureUrl ?? null : me?.signatureUrl ?? null
              const activeSigName = isDelegateApprover && activeSelectedPrincipal
                ? `${activeSelectedPrincipal.title.name}${activeSelectedPrincipal.firstName} ${activeSelectedPrincipal.lastName}`
                : approverName
              return (
                <div className="ks-card">
                  <div className="ks-card-header"><div className="eyebrow">{isViceStep ? "SIGN → รองผอ." : "APPROVE → ผอ."}</div></div>
                  <div className="ks-card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {isViceStep && !showConfirm && (
                      <div style={{ fontSize: 12.5, padding: "8px 12px", background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)", borderRadius: "var(--radius)", color: "var(--indigo-ink)" }}>
                        ลงนามเพื่อ<span style={{ fontWeight: 600 }}>ส่งต่อให้ผู้อำนวยการ</span>อนุมัติขั้นสุดท้าย
                      </div>
                    )}
                    {!showConfirm ? (
                      <>
                        {me && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--radius)" }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--indigo-wash)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <User size={14} style={{ color: "var(--indigo)" }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{approverName}</div>
                              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{approverRoleLabel}</div>
                            </div>
                          </div>
                        )}
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowConfirm(true)}
                          disabled={!me}
                          style={{ background: "var(--sage)", width: "100%", justifyContent: "center" }}
                        >
                          <ShieldCheck size={14} /> {isViceStep ? "ลงนามส่งต่อให้ ผอ." : "อนุมัติบันทึกทัณฑ์บนนี้"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div>
                          {isDelegateApprover && activePrincipals.length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>
                                เลือกลายเซ็นที่จะใช้ในเอกสาร
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {activePrincipals.map((p) => {
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
                            {isDelegateApprover ? "ลายเซ็นที่จะปรากฏในเอกสาร" : `ลายเซ็น — ${approverName}`}
                          </div>
                          <div className="sig-display" style={{ height: 120, borderColor: activeSigUrl ? "var(--sage)" : undefined }}>
                            {activeSigUrl
                              ? <img src={activeSigUrl} alt="ลายเซ็น" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 8 }} />
                              : <span style={{ fontSize: 12.5, color: "var(--ink-4)" }}>
                                  {isDelegateApprover && !selectedPrincipalId ? "กรุณาเลือกลายเซ็นด้านบน" : "ยังไม่มีลายเซ็นในระบบ"}
                                </span>}
                            {activeSigName && <span className="sig-name">{activeSigName}</span>}
                          </div>
                        </div>
                        {signError && (
                          <div style={{ fontSize: 13, color: "var(--rose)", padding: "8px 12px", background: "var(--rose-wash, #fff0f0)", borderRadius: "var(--radius)" }}>
                            {signError}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <button
                            className="btn btn-primary"
                            onClick={handleSign}
                            disabled={signing || (isDelegateApprover && !selectedPrincipalId)}
                            style={{ background: "var(--sage)", width: "100%", justifyContent: "center" }}
                          >
                            {signing
                              ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> กำลังบันทึก...</>
                              : <><Check size={14} /> {isViceStep ? "ยืนยันลงนามส่งต่อ" : "บันทึกการอนุมัติ"}</>
                            }
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => { setShowConfirm(false); setSignError(null) }}
                            disabled={signing}
                            style={{ width: "100%", justifyContent: "center" }}
                          >
                            <ChevronLeft size={14} /> ย้อนกลับ
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })()
          ) : (
            /* ── Info: waiting for the correct approver ── */
            <div className="ks-card">
              <div className="ks-card-header"><div className="eyebrow">STATUS</div></div>
              <div className="ks-card-pad" style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
                {isViceDirectorTurn
                  ? "รายการนี้รอรองผู้อำนวยการลงนาม"
                  : isDirectorTurn
                  ? "รายการนี้รอผู้อำนวยการอนุมัติขั้นสุดท้าย"
                  : "รายการนี้รอดำเนินการ"}
                {record.viceDirectorSignature && (
                  <div style={{ marginTop: 10 }}>
                    <SigBox label="รองผู้อำนวยการ (ลงนามแล้ว)" dataUrl={record.viceDirectorSignature} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="ks-card">
            <div className="ks-card-header"><div className="eyebrow">AUDIT</div></div>
            <div className="ks-card-pad" style={{ fontSize: 13 }}>
              <div className="info-row">
                <span className="info-label">วันที่ทำสัญญา</span>
                <span className="info-value mono">{formatThaiDate(record.contractDate)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">ผู้บันทึก</span>
                <span className="info-value">{record.recorder}</span>
              </div>
              <div className="info-row" style={{ borderBottom: 0 }}>
                <span className="info-label">สถานะ</span>
                <span className={`chip ${isSigned ? "chip-approved" : "chip-pending"}`} style={{ fontSize: 11 }}>
                  {isSigned ? "อนุมัติแล้ว"
                    : isViceDirectorTurn ? "รอรองผอ."
                    : isDirectorTurn ? "รอผอ."
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

function SigBox({ label, dataUrl }: { label: string; dataUrl: string | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", letterSpacing: "0.06em", color: "var(--ink-3)", textTransform: "uppercase" }}>
        {label}
      </div>
      <div className="sig-display" style={{ borderColor: dataUrl ? "var(--sage)" : undefined, background: dataUrl ? "var(--sage-wash)" : undefined }}>
        {dataUrl
          ? <img src={dataUrl} alt="signature" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
          : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ไม่มีลายเซ็น</span>}
      </div>
    </div>
  )
}
