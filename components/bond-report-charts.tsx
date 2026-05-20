"use client"

import { useState, useEffect, useCallback } from "react"

export interface BondStatsData {
  total: number
  studentCount: number
  byStatus: { status: string; count: number }[]
  pending: number
  approved: number
  bySemester: { semesterId: number; semesterName: string; count: number }[]
  monthlyTrend: { month: string; count: number }[]
  byGradeLevel: { gradeLevel: string; count: number }[]
  topStudents: {
    id: number
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    count: number
  }[]
  measures: {
    deductScore: number
    activity: number
    suspension: number
    transfer: number
  }
  academicYears: { id: number; year: number }[]
  semesters: { id: number; name: string; value: number }[]
}

const TEAL = "#0d9488"
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "ยังมีผล", color: "#059669" },
  expired: { label: "หมดอายุ", color: "#d97706" },
  closed: { label: "ปิดแล้ว", color: "#64748b" },
}
const RANK_COLORS = ["#0d9488", "#0891b2", "#7c3aed", "#ec4899", "#059669", "#d97706"]

const THAI_MONTHS: Record<string, string> = {
  "01": "ม.ค.", "02": "ก.พ.", "03": "มี.ค.", "04": "เม.ย.",
  "05": "พ.ค.", "06": "มิ.ย.", "07": "ก.ค.", "08": "ส.ค.",
  "09": "ก.ย.", "10": "ต.ค.", "11": "พ.ย.", "12": "ธ.ค.",
}

function formatMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-")
  return `${THAI_MONTHS[month] ?? month} ${parseInt(year) + 543}`
}

// ─── Animated counter ────────────────────────────────────────────
function AnimCount({ to, mounted }: { to: number; mounted: boolean }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!mounted) { setV(0); return }
    const dur = 850
    const start = Date.now()
    const id = setInterval(() => {
      const p = Math.min((Date.now() - start) / dur, 1)
      const e = 1 - (1 - p) ** 3
      setV(Math.round(e * to))
      if (p >= 1) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [mounted, to])
  return <>{v}</>
}

// ─── KPI Card ────────────────────────────────────────────────────
function KpiCard({
  n, eyebrow, value, label, color, mounted, sub,
}: {
  n: number; eyebrow: string; value: number; label: string; color: string; mounted: boolean; sub?: string
}) {
  return (
    <div className="ks-card" style={{ borderTop: `3px solid ${color}`, padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase" }}>
          {eyebrow}
        </span>
        <span style={{ color: "var(--ink-4)", fontSize: 10, fontFamily: "var(--font-mono)" }}>0{n}</span>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 42, lineHeight: 1, color, letterSpacing: "-0.02em", marginBottom: 10 }}>
        <AnimCount to={value} mounted={mounted} />
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 4, fontFamily: "var(--font-mono)" }}>{sub}</div>}
    </div>
  )
}

// ─── Status Donut ────────────────────────────────────────────────
function StatusDonut({ data, total, mounted }: { data: BondStatsData["byStatus"]; total: number; mounted: boolean }) {
  const sz = 200, sw = 38
  const r = (sz - sw) / 2
  const cx = sz / 2, cy = sz / 2
  const circ = 2 * Math.PI * r
  const GAP = 5
  let cum = 0
  const slices = data.map((d) => {
    const cfg = STATUS_CONFIG[d.status] ?? { label: d.status, color: "#888" }
    const raw = total > 0 ? (d.count / total) * circ : 0
    const s = { ...d, len: Math.max(0, raw - GAP), offset: cum, color: cfg.color, label: cfg.label }
    cum += raw
    return s
  })

  return (
    <div className="ks-card" style={{ padding: "22px 24px", height: "100%", boxSizing: "border-box" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 20 }}>
        02 · สถานะทัณฑ์บน
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={sw} />
            {slices.map((s, i) => (
              <circle
                key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.color} strokeWidth={sw} strokeLinecap="butt"
                strokeDasharray={mounted ? `${s.len} ${circ}` : `0 ${circ}`}
                strokeDashoffset={-s.offset}
                style={{ transition: `stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 0.22}s` }}
              />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 38, lineHeight: 1, letterSpacing: "-0.02em", color: "var(--ink)" }}>
              <AnimCount to={total} mounted={mounted} />
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 3 }}>รายการ</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 130 }}>
          {slices.length === 0 && <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>}
          {slices.map((s, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0, display: "inline-block" }} />
                  {s.label}
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  <AnimCount to={s.count} mounted={mounted} />
                </span>
              </div>
              <div style={{ height: 5, background: "var(--surface-2)", borderRadius: 99 }}>
                <div style={{
                  height: "100%", borderRadius: 99, background: s.color,
                  width: mounted && total > 0 ? `${(s.count / total) * 100}%` : "0%",
                  transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${0.1 + i * 0.2}s`,
                }} />
              </div>
              <div style={{ marginTop: 5, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                {total > 0 ? ((s.count / total) * 100).toFixed(1) : "0.0"}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Monthly Trend Area Chart (NEW chart type) ───────────────────
function MonthlyTrendChart({ data, mounted }: { data: BondStatsData["monthlyTrend"]; mounted: boolean }) {
  const W = 780, H = 190
  const PL = 44, PR = 16, PT = 20, PB = 48
  const iW = W - PL - PR
  const iH = H - PT - PB
  const maxV = Math.max(...data.map((d) => d.count), 1)
  const guides = [0, 0.25, 0.5, 0.75, 1]

  if (data.length === 0) {
    return (
      <div className="ks-card" style={{ padding: "22px 24px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 20 }}>
          03 · แนวโน้มรายเดือน
        </div>
        <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>
      </div>
    )
  }

  const pts = data.map((d, i) => ({
    x: PL + (data.length === 1 ? iW / 2 : (i / (data.length - 1)) * iW),
    y: PT + iH - (d.count / maxV) * iH,
    ...d,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PT + iH).toFixed(1)} L ${PL} ${(PT + iH).toFixed(1)} Z`

  let pathLen = 0
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x
    const dy = pts[i].y - pts[i - 1].y
    pathLen += Math.sqrt(dx * dx + dy * dy)
  }

  const labelStep = data.length > 14 ? 3 : data.length > 8 ? 2 : 1

  return (
    <div className="ks-card" style={{ padding: "22px 24px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 3 }}>
          03 · แนวโน้มรายเดือน
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>จำนวนทัณฑ์บนตามเดือน</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", overflow: "visible" }}>
        <defs>
          <linearGradient id="bond-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity="0.22" />
            <stop offset="100%" stopColor={TEAL} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y grid lines */}
        {guides.map((g) => {
          const y = PT + iH - g * iH
          return (
            <g key={g}>
              <line x1={PL} y1={y} x2={PL + iW} y2={y}
                style={{ stroke: "var(--surface-2)", strokeWidth: 1 }} />
              <text x={PL - 6} y={y + 4} textAnchor="end"
                style={{ fontSize: 9, fill: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>
                {g > 0 ? Math.round(maxV * g) : ""}
              </text>
            </g>
          )
        })}

        {/* Area */}
        <path d={areaPath} fill="url(#bond-area-grad)"
          style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.7s ease 0.3s" }} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={TEAL} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={`${pathLen} ${pathLen}`}
          strokeDashoffset={mounted ? 0 : pathLen}
          style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s" }} />

        {/* Dots + tooltips */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={TEAL} stroke="white" strokeWidth="2"
              style={{ opacity: mounted ? 1 : 0, transition: `opacity 0.25s ease ${0.8 + i * 0.04}s` }} />
            {/* Count label above dot */}
            <text x={p.x} y={p.y - 10} textAnchor="middle"
              style={{ fontSize: 9.5, fill: "var(--ink-3)", fontFamily: "var(--font-mono)", opacity: mounted ? 1 : 0, transition: `opacity 0.25s ease ${0.85 + i * 0.04}s` }}>
              {p.count}
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {pts.map((p, i) =>
          i % labelStep === 0 ? (
            <text key={i} x={p.x} y={H - 10} textAnchor="middle"
              style={{ fontSize: 9, fill: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>
              {formatMonthLabel(p.month)}
            </text>
          ) : null
        )}
      </svg>
    </div>
  )
}

// ─── Grade level + Measure type analysis ─────────────────────────
function GradeAndMeasureSection({
  byGradeLevel, measures, total, mounted,
}: {
  byGradeLevel: BondStatsData["byGradeLevel"]
  measures: BondStatsData["measures"]
  total: number
  mounted: boolean
}) {
  const maxGrade = Math.max(...byGradeLevel.map((g) => g.count), 1)
  const gradeColors = ["#0d9488", "#0891b2", "#2563eb", "#7c3aed", "#ec4899", "#d97706"]
  const measureItems = [
    { label: "ตัดคะแนน", count: measures.deductScore, color: "#dc2626" },
    { label: "พักการเรียน", count: measures.suspension, color: "#7c3aed" },
    { label: "ทำกิจกรรม", count: measures.activity, color: "#d97706" },
    { label: "ย้ายสถานศึกษา", count: measures.transfer, color: "#64748b" },
  ]
  const maxMeasure = Math.max(...measureItems.map((m) => m.count), 1)

  return (
    <div className="ks-card" style={{ padding: "22px 24px" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 3 }}>
          04 · ระดับชั้นและมาตรการ
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>วิเคราะห์ตามระดับชั้นและประเภทมาตรการหากทำผิดซ้ำ</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {/* Left: grade level */}
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 16 }}>
            ทัณฑ์บนตามระดับชั้น
          </div>
          {byGradeLevel.length === 0 ? (
            <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {byGradeLevel.map((g, i) => {
                const pct = total > 0 ? (g.count / total) * 100 : 0
                return (
                  <div key={g.gradeLevel} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", flexShrink: 0 }}>
                      {g.gradeLevel}
                    </div>
                    <div style={{ flex: 1, height: 22, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        width: mounted ? `${(g.count / maxGrade) * 100}%` : "0%",
                        height: "100%", background: gradeColors[i % gradeColors.length]!, borderRadius: 4, opacity: 0.85,
                        transition: `width 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 0.08}s`,
                      }} />
                    </div>
                    <div style={{ width: 26, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", flexShrink: 0 }}>
                      {g.count}
                    </div>
                    <div style={{ width: 36, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-4)", flexShrink: 0 }}>
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: measure type */}
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 4 }}>
            ประเภทมาตรการหากทำผิดซ้ำ
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 16 }}>
            จาก {total} รายการทั้งหมด
          </div>
          {total === 0 ? (
            <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {measureItems.map((m, i) => {
                const pct = total > 0 ? (m.count / total) * 100 : 0
                return (
                  <div key={m.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: m.color, flexShrink: 0, display: "inline-block" }} />
                        <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{m.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                          <AnimCount to={m.count} mounted={mounted} />
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-4)" }}>
                          / {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 99 }}>
                      <div style={{
                        height: "100%", borderRadius: 99, background: m.color,
                        width: mounted ? `${(m.count / maxMeasure) * 100}%` : "0%",
                        transition: `width 0.7s cubic-bezier(0.4,0,0.2,1) ${0.1 + i * 0.12}s`,
                        opacity: 0.85,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Semester column chart ───────────────────────────────────────
function SemesterChart({ data, mounted }: { data: BondStatsData["bySemester"]; mounted: boolean }) {
  const H = 140
  const SEM_COLORS = ["#0d9488", "#5eead4"]
  const max = Math.max(...data.map((d) => d.count), 1)
  const guides = [0.25, 0.5, 0.75, 1]

  return (
    <div className="ks-card" style={{ padding: "22px 24px", height: "100%", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 3 }}>
          01 · ภาคเรียน
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>จำนวนตามภาคเรียน</div>
      </div>
      {data.length === 0 ? (
        <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>
      ) : (
        <div style={{ position: "relative", height: H + 50 }}>
          {guides.map((t) => (
            <div key={t} style={{ position: "absolute", left: 0, right: 0, bottom: H * t + 42, display: "flex", alignItems: "center", pointerEvents: "none" }}>
              <div style={{ flex: 1, borderTop: "1px dashed var(--surface-2)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-4)", paddingLeft: 6 }}>
                {Math.round(max * t)}
              </span>
            </div>
          ))}
          <div style={{ position: "absolute", left: 0, right: 28, bottom: 0, height: H + 44, display: "flex", alignItems: "flex-end", gap: 12 }}>
            {data.map((b, i) => (
              <div key={b.semesterId} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-2)", marginBottom: 6, fontWeight: 500 }}>
                  {b.count}
                </div>
                <div style={{ width: "100%", height: H, display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%",
                    height: mounted ? `${(b.count / max) * 100}%` : "1.5%",
                    minHeight: 4, background: SEM_COLORS[i % SEM_COLORS.length]!,
                    borderRadius: "6px 6px 0 0",
                    transition: `height 0.7s cubic-bezier(0.34,1.38,0.64,1) ${i * 0.1}s`,
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: "rgba(255,255,255,0.22)", borderRadius: "6px 6px 0 0" }} />
                  </div>
                </div>
                <div style={{ width: "100%", height: 2, background: "var(--surface-2)", margin: "0 0 10px" }} />
                <div style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "center", lineHeight: 1.4 }}>
                  {b.semesterName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Top students with bonds ─────────────────────────────────────
function BondTopStudents({ data }: { data: BondStatsData["topStudents"] }) {
  const max = data[0]?.count || 1
  return (
    <div className="ks-card">
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--surface-2)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 4 }}>
            TOP · นักเรียนที่มีทัณฑ์บนมากที่สุด
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>อันดับนักเรียนบันทึกทัณฑ์บน</div>
        </div>
      </div>
      <div style={{ padding: "18px 24px 22px" }}>
        {data.length === 0 ? (
          <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>
        ) : (
          data.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: i < 3 ? RANK_COLORS[i] : "var(--surface-2)",
                border: i >= 3 ? "1px solid var(--surface-2)" : "none",
                color: i < 3 ? "#fff" : "var(--ink-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(13,148,136,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600, color: TEAL, flexShrink: 0,
              }}>
                {s.firstName?.[0]}{s.lastName?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                  {s.firstName} {s.lastName}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                  {s.studentCode} · {s.gradeLevel}/{s.classRoom}
                </div>
              </div>
              <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${(s.count / max) * 100}%`, height: "100%", background: RANK_COLORS[i] ?? "var(--surface-2)", borderRadius: 99 }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, color: RANK_COLORS[i] ?? "var(--ink-3)", letterSpacing: "-0.02em", width: 28, textAlign: "right" }}>
                  {s.count}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────
export function BondReportCharts({ initialData }: { initialData: BondStatsData }) {
  const [data, setData] = useState(initialData)
  const [yearId, setYearId] = useState(String(initialData.academicYears[0]?.id ?? ""))
  const [semesterId, setSemesterId] = useState("all")
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const fetchData = useCallback(async (yId: string, sId: string) => {
    setLoading(true)
    setMounted(false)
    try {
      const params = new URLSearchParams()
      if (yId) params.set("yearId", yId)
      if (sId !== "all") params.set("semesterId", sId)
      const res = await fetch(`/api/reports/bond-stats?${params}`)
      if (res.ok) {
        const next = await res.json()
        setData(next)
        setTimeout(() => setMounted(true), 80)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleYearChange = (v: string) => { setYearId(v); fetchData(v, semesterId) }
  const handleSemesterChange = (v: string) => { setSemesterId(v); fetchData(yearId, v) }

  const approvalRate = data.total > 0 ? ((data.approved / data.total) * 100).toFixed(0) : "0"
  const activeCount = data.byStatus.find((s) => s.status === "active")?.count ?? 0

  return (
    <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <select className="ks-select" style={{ width: 168 }} value={yearId} onChange={(e) => handleYearChange(e.target.value)}>
          {data.academicYears.map((y) => (
            <option key={y.id} value={y.id}>ปีการศึกษา {y.year}</option>
          ))}
        </select>
        <select className="ks-select" style={{ width: 168 }} value={semesterId} onChange={(e) => handleSemesterChange(e.target.value)}>
          <option value="all">ทุกภาคเรียน</option>
          {data.semesters.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <KpiCard n={1} eyebrow="TOTAL BONDS" value={data.total} label="บันทึกทัณฑ์บนทั้งหมด" color={TEAL} mounted={mounted} />
        <KpiCard n={2} eyebrow="STUDENTS" value={data.studentCount} label="นักเรียนที่มีทัณฑ์บน" color="#059669" mounted={mounted} />
        <KpiCard n={3} eyebrow="ACTIVE" value={activeCount} label="ทัณฑ์บนที่ยังมีผล" color="#d97706" mounted={mounted} />
        <KpiCard n={4} eyebrow="APPROVED" value={data.approved} label="อนุมัติแล้ว" color="#2563eb" mounted={mounted} sub={`อัตราอนุมัติ ${approvalRate}%`} />
      </div>

      {/* Status + Monthly trend */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, marginBottom: 24, alignItems: "start" }}>
        <StatusDonut data={data.byStatus} total={data.total} mounted={mounted} />
        <MonthlyTrendChart data={data.monthlyTrend} mounted={mounted} />
      </div>

      {/* Semester */}
      <div style={{ marginBottom: 24 }}>
        <SemesterChart data={data.bySemester} mounted={mounted} />
      </div>

      {/* Grade level + Measure type */}
      <div style={{ marginBottom: 24 }}>
        <GradeAndMeasureSection byGradeLevel={data.byGradeLevel} measures={data.measures} total={data.total} mounted={mounted} />
      </div>

      {/* Top students */}
      <BondTopStudents data={data.topStudents} />
    </div>
  )
}
