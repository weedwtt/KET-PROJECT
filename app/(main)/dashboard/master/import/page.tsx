"use client"

import { useRef, useState, useCallback } from "react"
import { read, utils } from "xlsx"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Loader2, Eye, ArrowRight } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type ParsedRow = string[]

type PreviewRow = {
  rowNum: number
  studentCode: string
  classRoom: string
  classNumber: string
  titleName: string
  firstName: string
  lastName: string
  birthDate: string
  nationalId: string
  fatherName: string
  motherName: string
  advisor1: string
  advisor2: string
  raw: ParsedRow
}

type ProgressEvent =
  | { type: "start"; total: number }
  | { type: "progress"; row: number; done: number; skipped: number; total: number; studentCode: string; name: string }
  | { type: "skip"; row: number; message: string }
  | { type: "error"; row: number; message: string }
  | { type: "warn"; row: number; message: string }
  | { type: "done"; done: number; skipped: number; errors: number; total: number }
  | { type: "fatal"; message: string }

type ImportStatus = "idle" | "previewing" | "importing" | "done" | "fatal"

// ─── Column indices (matches template.xlsx) ───────────────────────────────────
const COL = {
  SEQ: 0, ROOM: 1, CLASS_NUM: 2, STUDENT_CODE: 3,
  TITLE: 4, FIRST: 5, LAST: 6, BIRTH: 7, NATIONAL_ID: 8,
  PHONE: 10, FATHER: 11, MOTHER: 12,
  GUARDIAN1_PHONE: 13, GUARDIAN1: 14,
  GUARDIAN2_PHONE: 15, GUARDIAN2: 16,
  GUARDIAN3_PHONE: 17, GUARDIAN3: 18,
  NATIONALITY: 19, ETHNICITY: 20, RELIGION: 21, BLOOD: 22,
  ADDR_NO: 23, ADDR_MOO: 24, ADDR_VILLAGE: 25,
  ADDR_ROAD: 26, ADDR_SOI: 27, ADDR_SUB: 28, ADDR_DIST: 29,
  ADDR_PROV: 30, ADDR_POST: 31, ADVISOR1: 32, ADVISOR2: 33,
}

function cellStr(row: ParsedRow, col: number): string {
  const v = row[col]
  return v === null || v === undefined || String(v) === "NaN" ? "" : String(v).trim()
}

function toPreviewRow(raw: ParsedRow, rowNum: number): PreviewRow {
  return {
    rowNum,
    studentCode: cellStr(raw, COL.STUDENT_CODE),
    classRoom: cellStr(raw, COL.ROOM),
    classNumber: cellStr(raw, COL.CLASS_NUM),
    titleName: cellStr(raw, COL.TITLE),
    firstName: cellStr(raw, COL.FIRST),
    lastName: cellStr(raw, COL.LAST),
    birthDate: cellStr(raw, COL.BIRTH),
    nationalId: cellStr(raw, COL.NATIONAL_ID),
    fatherName: cellStr(raw, COL.FATHER),
    motherName: cellStr(raw, COL.MOTHER),
    advisor1: cellStr(raw, COL.ADVISOR1),
    advisor2: cellStr(raw, COL.ADVISOR2),
    raw,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportStudentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const [fileName, setFileName] = useState("")
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [status, setStatus] = useState<ImportStatus>("idle")
  const [progress, setProgress] = useState({ done: 0, skipped: 0, errors: 0, total: 0 })
  const [log, setLog] = useState<{ type: string; text: string }[]>([])
  const [dragOver, setDragOver] = useState(false)

  function appendLog(type: string, text: string) {
    setLog(prev => [...prev, { type, text }])
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  const parseFile = useCallback((file: File) => {
    setFileName(file.name)
    setStatus("idle")
    setLog([])

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = read(data, { type: "binary", raw: false, cellDates: false })
        const sheetName = wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        const allRows: string[][] = utils.sheet_to_json(ws, { header: 1, defval: "" })

        // Find header row (contains "รหัสนักเรียน")
        let headerIdx = 0
        for (let i = 0; i < Math.min(5, allRows.length); i++) {
          if (allRows[i].some(c => String(c).includes("รหัสนักเรียน"))) {
            headerIdx = i
            break
          }
        }

        const dataRows = allRows.slice(headerIdx + 1).filter(r => {
          const code = r[COL.STUDENT_CODE]
          return code && String(code).trim() !== "" && String(code).trim() !== "NaN"
        })

        setRows(dataRows as ParsedRow[])
        setPreviewRows((dataRows as ParsedRow[]).map((r, i) => toPreviewRow(r, i + 1)))
        setStatus("previewing")
      } catch {
        appendLog("error", "อ่านไฟล์ไม่ได้ — ตรวจสอบว่าเป็นไฟล์ .xlsx หรือ .xls")
      }
    }
    reader.readAsBinaryString(file)
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) parseFile(file)
  }

  async function startImport() {
    if (!rows.length) return
    setStatus("importing")
    setProgress({ done: 0, skipped: 0, errors: 0, total: rows.length })
    setLog([])

    try {
      const res = await fetch("/api/master/import/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      })

      if (!res.ok || !res.body) {
        appendLog("error", `เซิร์ฟเวอร์ตอบกลับ ${res.status}`)
        setStatus("fatal")
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          try {
            const evt = JSON.parse(line.slice(6)) as ProgressEvent

            if (evt.type === "start") {
              appendLog("info", `เริ่มนำเข้า ${evt.total} รายการ`)
            } else if (evt.type === "progress") {
              setProgress(p => ({ ...p, done: evt.done, skipped: evt.skipped }))
              appendLog("ok", `[${evt.row}] นำเข้า ${evt.name} (${evt.studentCode}) สำเร็จ`)
            } else if (evt.type === "skip") {
              setProgress(p => ({ ...p, skipped: p.skipped + 1 }))
              appendLog("warn", `[${evt.row}] ข้าม: ${evt.message}`)
            } else if (evt.type === "error") {
              setProgress(p => ({ ...p, errors: p.errors + 1 }))
              appendLog("error", `[${evt.row}] ผิดพลาด: ${evt.message}`)
            } else if (evt.type === "warn") {
              appendLog("warn", `[${evt.row}] คำเตือน: ${evt.message}`)
            } else if (evt.type === "done") {
              setProgress({ done: evt.done, skipped: evt.skipped, errors: evt.errors, total: evt.total })
              appendLog("info", `เสร็จสิ้น — นำเข้าสำเร็จ ${evt.done} รายการ, ข้าม ${evt.skipped}, ผิดพลาด ${evt.errors}`)
              setStatus("done")
            } else if (evt.type === "fatal") {
              appendLog("error", `ข้อผิดพลาดร้ายแรง: ${evt.message}`)
              setStatus("fatal")
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err) {
      appendLog("error", err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ")
      setStatus("fatal")
    }
  }

  const pct = progress.total > 0 ? Math.round(((progress.done + progress.skipped) / progress.total) * 100) : 0

  return (
    <div className="ks-page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span>ข้อมูลหลัก · นักเรียน</span></div>
          <h1>นำเข้าข้อมูลนักเรียน</h1>
        </div>
      </div>

      <p style={{ color: "var(--ink-3)", fontSize: 13, marginBottom: 24, maxWidth: 640 }}>
        อัปโหลดไฟล์ <strong>.xlsx</strong> หรือ <strong>.xls</strong> ที่มีโครงสร้างตามแบบฟอร์มมาตรฐาน
        ระบบจะแสดงตัวอย่างข้อมูลก่อนนำเข้าจริง และนำเข้าข้อมูลนักเรียน · ผู้ปกครอง · ครูที่ปรึกษา พร้อมกัน
      </p>

      {/* ── Upload zone ── */}
      {status === "idle" && (
        <div
          className="import-dropzone"
          data-drag={dragOver ? "true" : "false"}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <Upload size={28} style={{ color: "var(--indigo)", marginBottom: 8 }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>คลิกหรือลากไฟล์มาวางที่นี่</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>รองรับ .xlsx และ .xls</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
        </div>
      )}

      {/* ── File selected + preview ── */}
      {status === "previewing" && (
        <>
          <div className="import-file-bar">
            <FileSpreadsheet size={16} style={{ color: "var(--indigo)" }} />
            <span style={{ fontWeight: 500 }}>{fileName}</span>
            <span style={{ color: "var(--ink-3)", fontSize: 13 }}>
              พบข้อมูล <strong>{previewRows.length}</strong> รายการ
            </span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: "auto" }}
              onClick={() => { setStatus("idle"); setRows([]); setPreviewRows([]) }}
            >
              เปลี่ยนไฟล์
            </button>
            <button className="btn btn-primary btn-sm" onClick={startImport}>
              <ArrowRight size={14} /> นำเข้าข้อมูล ({previewRows.length} รายการ)
            </button>
          </div>

          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13 }}>
            <Eye size={14} />
            ตัวอย่างข้อมูล (แสดงสูงสุด 100 แถวแรก)
          </div>

          <div className="import-preview-wrap">
            <table className="ks-table import-preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>รหัส</th>
                  <th>ห้อง</th>
                  <th>เลขที่</th>
                  <th>คำนำหน้า</th>
                  <th>ชื่อ</th>
                  <th>สกุล</th>
                  <th>วันเกิด</th>
                  <th>เลขบัตร ปชช.</th>
                  <th>บิดา</th>
                  <th>มารดา</th>
                  <th>ครูที่ปรึกษา 1</th>
                  <th>ครูที่ปรึกษา 2</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 100).map((r) => (
                  <tr key={r.rowNum}>
                    <td className="mono" style={{ color: "var(--ink-3)" }}>{r.rowNum}</td>
                    <td className="mono">{r.studentCode}</td>
                    <td>{r.classRoom}</td>
                    <td className="mono">{r.classNumber}</td>
                    <td>{r.titleName}</td>
                    <td>{r.firstName}</td>
                    <td>{r.lastName}</td>
                    <td style={{ fontSize: 12 }}>{r.birthDate}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{r.nationalId}</td>
                    <td style={{ fontSize: 12 }}>{r.fatherName}</td>
                    <td style={{ fontSize: 12 }}>{r.motherName}</td>
                    <td style={{ fontSize: 12 }}>{r.advisor1}</td>
                    <td style={{ fontSize: 12 }}>{r.advisor2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewRows.length > 100 && (
            <div style={{ textAlign: "center", color: "var(--ink-3)", fontSize: 13, marginTop: 8 }}>
              แสดง 100 / {previewRows.length} รายการ — กด &quot;นำเข้าข้อมูล&quot; เพื่อนำเข้าทั้งหมด
            </div>
          )}
        </>
      )}

      {/* ── Import progress ── */}
      {(status === "importing" || status === "done" || status === "fatal") && (
        <>
          <div className="import-file-bar">
            <FileSpreadsheet size={16} style={{ color: "var(--indigo)" }} />
            <span style={{ fontWeight: 500 }}>{fileName}</span>
            {status === "importing" && (
              <span style={{ color: "var(--indigo)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <Loader2 size={13} className="spin" /> กำลังนำเข้า...
              </span>
            )}
            {status === "done" && (
              <span style={{ color: "var(--sage)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={14} /> เสร็จสิ้น
              </span>
            )}
            {status === "fatal" && (
              <span style={{ color: "var(--rose)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <XCircle size={14} /> เกิดข้อผิดพลาด
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="import-progress-block">
            <div className="import-progress-bar-wrap">
              <div
                className="import-progress-bar-fill"
                style={{
                  width: `${pct}%`,
                  backgroundColor: status === "fatal" ? "var(--rose)"
                    : status === "done" ? "var(--sage)"
                    : "var(--indigo)",
                }}
              />
            </div>
            <div className="import-progress-stats">
              <span style={{ color: "var(--sage)" }}>
                <CheckCircle2 size={13} /> สำเร็จ {progress.done}
              </span>
              <span style={{ color: "var(--amber)" }}>
                <AlertCircle size={13} /> ข้าม {progress.skipped}
              </span>
              <span style={{ color: "var(--rose)" }}>
                <XCircle size={13} /> ผิดพลาด {progress.errors}
              </span>
              <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>
                {progress.done + progress.skipped} / {progress.total} ({pct}%)
              </span>
            </div>
          </div>

          {/* Log */}
          <div className="import-log">
            {log.map((l, i) => (
              <div key={i} className={`import-log-line import-log-${l.type}`}>
                {l.type === "ok"    && <CheckCircle2 size={12} />}
                {l.type === "error" && <XCircle size={12} />}
                {l.type === "warn"  && <AlertCircle size={12} />}
                {l.type === "info"  && <span style={{ width: 12, display: "inline-block" }} />}
                <span>{l.text}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {(status === "done" || status === "fatal") && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => {
                setStatus("idle")
                setRows([])
                setPreviewRows([])
                setLog([])
                setFileName("")
              }}
            >
              นำเข้าไฟล์ใหม่
            </button>
          )}
        </>
      )}
    </div>
  )
}
