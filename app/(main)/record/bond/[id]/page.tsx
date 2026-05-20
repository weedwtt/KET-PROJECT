"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, FileText, Pencil } from "lucide-react"

type BondDetail = {
  id: number
  updatedAt: string
  contractDate: string
  guardianName: string
  guardianRelation: string
  guardianPhone: string | null
  addressHouseNo: string | null
  addressMoo: string | null
  addressVillage: string | null
  addressRoad: string | null
  addressSoi: string | null
  addressSubDistrict: string | null
  addressDistrict: string | null
  addressProvince: string | null
  violationDetail: string
  recorder: string
  status: string
  measureDeductScore: boolean
  measureDeductPoints: number | null
  measureActivity: boolean
  measureSuspension: boolean
  measureTransfer: boolean
  guardianSignature: string | null
  studentSignature: string | null
  advisorSignature: string | null
  viceDirectorSignature: string | null
  directorSignature: string | null
  approvedByTeacher: { id: number; firstName: string; lastName: string; title: { name: string } } | null
  approvedAt: string | null
  headTeacher: { id: number; firstName: string; lastName: string; title: { name: string }; signatureUrl: string | null } | null
  disciplineTeacher: { id: number; firstName: string; lastName: string; title: { name: string }; signatureUrl: string | null } | null
  student: {
    id: number
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    classNumber: number
    title: { name: string }
    guardians: { id: number; firstName: string; lastName: string; phone: string; relation: { name: string } }[]
    advisors: { slot: number; teacher: { id: number; firstName: string; lastName: string; title: { name: string } } }[]
  }
}

const STATUS_LABEL: Record<string, string> = {
  active: "มีผลบังคับ",
  expired: "ครบกำหนด",
  closed: "ปิดแล้ว",
}

const STATUS_CLASS: Record<string, string> = {
  active: "chip-approved",
  expired: "chip-pending",
  closed: "",
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
  const time = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543} · ${time} น.`
}

function sigCount(r: BondDetail) {
  let n = 0
  if (r.guardianSignature) n++
  if (r.studentSignature) n++
  if (r.advisorSignature) n++
  if (r.headTeacher) n++
  if (r.disciplineTeacher) n++
  if (r.viceDirectorSignature) n++
  if (r.directorSignature) n++
  return n
}

export default function BondDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [record, setRecord] = useState<BondDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/bonds/${id}`)
      .then((r) => r.json())
      .then((data) => { setRecord(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="ks-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div style={{ color: "var(--ink-3)" }}>กำลังโหลด...</div>
    </div>
  )

  if (!record) return (
    <div className="ks-page empty-state">ไม่พบรายการ</div>
  )

  const isSigned = !!record.directorSignature
  const advisor1 = record.student.advisors.find((a) => a.slot === 1)?.teacher
  const sigs = sigCount(record)

  const measures: string[] = []
  if (record.measureDeductScore) measures.push(`ตัดคะแนนความประพฤติ${record.measureDeductPoints ? ` ${record.measureDeductPoints} คะแนน` : ""}`)
  if (record.measureActivity) measures.push("กิจกรรมค่ายปรับพฤติกรรม")
  if (record.measureSuspension) measures.push("พักการเรียน")
  if (record.measureTransfer) measures.push("ย้ายสถานศึกษา")

  const addressParts = [
    record.addressHouseNo ? `บ้านเลขที่ ${record.addressHouseNo}` : null,
    record.addressMoo ? `หมู่ ${record.addressMoo}` : null,
    record.addressVillage ?? null,
    record.addressSoi ? `ซอย ${record.addressSoi}` : null,
    record.addressRoad ? `ถนน ${record.addressRoad}` : null,
    record.addressSubDistrict ? `ต.${record.addressSubDistrict}` : null,
    record.addressDistrict ? `อ.${record.addressDistrict}` : null,
    record.addressProvince ? `จ.${record.addressProvince}` : null,
  ].filter(Boolean).join(" ")

  return (
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span>บันทึกทัณฑ์บน · BK-{String(record.id).padStart(4, "0")}</span>
          </div>
          <h1>ทัณฑ์บน — {record.student.title.name}{record.student.firstName} {record.student.lastName}</h1>
        </div>
        <div className="page-actions">
          <Link href="/record/bond" className="btn btn-ghost">
            <ChevronLeft size={14} />ย้อนกลับ
          </Link>
          {!isSigned && (
            <Link href={`/record/bond/${id}/edit`} className="btn btn-secondary">
              <Pencil size={14} />แก้ไข
            </Link>
          )}
          <a href={`/api/bonds/${id}/export-pdf`} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
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
              <span className={`chip ${isSigned ? (STATUS_CLASS[record.status] ?? "") : "chip-pending"}`}>
                {isSigned ? (STATUS_LABEL[record.status] ?? record.status) : "รออนุมัติ"}
              </span>
            </div>
            <div style={{ padding: "0 24px" }}>
              <div style={{ padding: "16px 0", borderBottom: "1px solid var(--rule)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  STUDENT ID · {record.student.studentCode}
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, margin: "4px 0 2px" }}>
                  {record.student.title.name}{record.student.firstName} {record.student.lastName}
                </div>
                <div style={{ color: "var(--ink-2)", fontSize: 13 }}>
                  ชั้น {record.student.gradeLevel}/{record.student.classRoom} · เลขที่ {record.student.classNumber}
                </div>
              </div>
              {record.student.guardians[0] && (
                <InfoRow label="ผู้ปกครอง (ระบบ)" value={`${record.student.guardians[0].firstName} ${record.student.guardians[0].lastName}`} />
              )}
              {advisor1 && (
                <InfoRow label="ครูที่ปรึกษา" value={`${advisor1.title.name}${advisor1.firstName} ${advisor1.lastName}`} />
              )}
            </div>
          </div>

          {/* 02 Contract */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>02 · CONTRACT</div>
                <div className="ks-card-title">ข้อมูลสัญญาและผู้ปกครอง</div>
              </div>
            </div>
            <div style={{ padding: "0 24px 18px" }}>
              <InfoRow label="วันที่ทำสัญญา" value={formatThaiDate(record.contractDate)} mono />
              <InfoRow label="ผู้บันทึก" value={record.recorder} />
              <InfoRow label="ชื่อผู้ปกครอง" value={record.guardianName} />
              <InfoRow label="ความสัมพันธ์" value={record.guardianRelation || "—"} />
              {record.guardianPhone && <InfoRow label="โทรศัพท์" value={record.guardianPhone} mono />}
              {addressParts && <InfoRow label="ที่อยู่" value={addressParts} />}
              {record.violationDetail && (
                <div style={{ paddingTop: 16, marginTop: 6, borderTop: "1px solid var(--rule-soft)" }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>รายละเอียดความผิด</div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--ink)" }}>{record.violationDetail}</p>
                </div>
              )}
            </div>
          </div>

          {/* 03 Measures */}
          {measures.length > 0 && (
            <div className="ks-card">
              <div className="ks-card-header">
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>03 · MEASURES</div>
                  <div className="ks-card-title">มาตรการหากทำผิดซ้ำ</div>
                </div>
              </div>
              <div style={{ padding: "0 24px 20px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {measures.map((m) => (
                    <span key={m} className="measure-tag"><span className="dot" />{m}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 04 Signatures */}
          <div className="ks-card">
            <div className="ks-card-header">
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>04 · SIGNATURES</div>
                <div className="ks-card-title">ลายเซ็น</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ height: 6, width: 80, background: "var(--rule)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(sigs / 7) * 100}%`, background: sigs === 7 ? "var(--sage)" : "var(--indigo)", borderRadius: 3 }} />
                </div>
                <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{sigs}/7</span>
              </div>
            </div>
            <div className="ks-card-pad">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                <SigBox
                  label="ผู้ปกครอง"
                  name={record.guardianName}
                  dataUrl={record.guardianSignature}
                />
                <SigBox
                  label="นักเรียน"
                  name={`${record.student.title.name}${record.student.firstName} ${record.student.lastName}`}
                  dataUrl={record.studentSignature}
                />
                <SigBox
                  label="ครูที่ปรึกษา"
                  name={advisor1 ? `${advisor1.title.name}${advisor1.firstName} ${advisor1.lastName}` : "—"}
                  dataUrl={record.advisorSignature}
                />
              </div>
              {(record.headTeacher || record.disciplineTeacher) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  {record.headTeacher && (
                    <SigBox
                      label="หัวหน้าระดับ"
                      name={`${record.headTeacher.title.name}${record.headTeacher.firstName} ${record.headTeacher.lastName}`}
                      dataUrl={record.headTeacher.signatureUrl}
                    />
                  )}
                  {record.disciplineTeacher && (
                    <SigBox
                      label="ครูฝ่ายปกครอง"
                      name={`${record.disciplineTeacher.title.name}${record.disciplineTeacher.firstName} ${record.disciplineTeacher.lastName}`}
                      dataUrl={record.disciplineTeacher.signatureUrl}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)", position: "sticky", top: 16 }}>
          {isSigned && (
            <div className="ks-card ks-card-pad" style={{ background: "var(--sage-soft)" }}>
              <div className="eyebrow" style={{ marginBottom: 12, color: "var(--sage)" }}>อนุมัติแล้ว</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                {record.approvedByTeacher
                  ? `${record.approvedByTeacher.title.name}${record.approvedByTeacher.firstName} ${record.approvedByTeacher.lastName}`
                  : "ผู้อำนวยการ"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                {formatThaiDateTime(record.approvedAt ?? record.updatedAt)}
              </div>
              {record.directorSignature && (
                <div className="sig-display" style={{ marginTop: 14, borderColor: "var(--sage)", background: "var(--sage-wash, #f0fdf4)" }}>
                  <img src={record.directorSignature} alt="ลายเซ็นผู้อำนวยการ" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                  <div className="sig-name">ผู้อำนวยการ</div>
                </div>
              )}
            </div>
          )}

          <div className="ks-card ks-card-pad">
            <div className="eyebrow" style={{ marginBottom: 12 }}>AUDIT</div>
            <InfoRow label="รหัส" value={`BK-${String(record.id).padStart(4, "0")}`} mono />
            <InfoRow label="วันที่ทำสัญญา" value={formatThaiDate(record.contractDate)} mono />
            <InfoRow label="ผู้บันทึก" value={record.recorder} />
            <div className="info-row" style={{ borderBottom: 0 }}>
              <span className="info-label">ลายเซ็น</span>
              <span className="info-value mono">{sigs}/7</span>
            </div>
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

function SigBox({ label, name, dataUrl }: { label: string; name?: string; dataUrl: string | null }) {
  return (
    <div>
      <div
        className="sig-display"
        style={{
          borderColor: dataUrl ? "var(--sage)" : undefined,
          background: dataUrl ? "var(--sage-wash, #f0fdf4)" : undefined,
        }}
      >
        {dataUrl
          ? <img src={dataUrl} alt="signature" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
          : <span style={{ fontSize: 12, color: "var(--ink-4)" }}>ไม่มีลายเซ็น</span>}
        <div className="sig-name">{label}</div>
      </div>
      {name && <div style={{ fontSize: 12.5, marginTop: 8 }}>{name}</div>}
    </div>
  )
}
