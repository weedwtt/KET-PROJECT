"use client"

import { useState, useEffect, useCallback } from "react"
import { Download } from "lucide-react"

export interface StatsData {
  totalRecords: number
  studentCount: number
  pending: number
  approved: number
  bySemester: { semesterId: number; semesterName: string; count: number }[]
  byCategory: { categoryId: number; categoryName: string; count: number }[]
  bySubCategory: {
    subId: number
    subName: string
    categoryId: number
    categoryName: string
    count: number
  }[]
  monthlyTrend: { month: string; count: number }[]
  byGradeLevel: { gradeLevel: string; count: number }[]
  categoryMomentum: {
    categoryId: number
    categoryName: string
    first: number
    second: number
    delta: number
  }[]
  topStudents: {
    id: number
    studentCode: string
    firstName: string
    lastName: string
    gradeLevel: string
    classRoom: number
    count: number
  }[]
  academicYears: { id: number; year: number }[]
  semesters: { id: number; name: string; value: number }[]
}

const CAT_COLORS = [
  "#2563eb",
  "#0891b2",
  "#7c3aed",
  "#ec4899",
  "#f59e0b",
  "#dc2626",
  "#059669",
  "#ea580c",
]
const RANK_COLORS = ["#2563eb", "#0891b2", "#7c3aed", "#ec4899", "#059669", "#d97706"]

const THAI_MONTHS: Record<string, string> = {
  "01": "ม.ค.",
  "02": "ก.พ.",
  "03": "มี.ค.",
  "04": "เม.ย.",
  "05": "พ.ค.",
  "06": "มิ.ย.",
  "07": "ก.ค.",
  "08": "ส.ค.",
  "09": "ก.ย.",
  "10": "ต.ค.",
  "11": "พ.ย.",
  "12": "ธ.ค.",
}

function formatMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-")
  return `${THAI_MONTHS[month] ?? month} ${parseInt(year) + 543}`
}

// ─── Animated counter ───────────────────────────────────────────
function AnimCount({ to, mounted }: { to: number; mounted: boolean }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!mounted) {
      setV(0)
      return
    }
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

// ─── KPI Card ───────────────────────────────────────────────────
function KpiCard({
  n,
  eyebrow,
  value,
  label,
  color,
  mounted,
}: {
  n: number
  eyebrow: string
  value: number
  label: string
  color: string
  mounted: boolean
}) {
  return (
    <div className="ks-card" style={{ borderTop: `3px solid ${color}`, padding: "20px 22px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "var(--ink-3)",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </span>
        <span
          style={{ color: "var(--ink-4)", fontSize: 10, fontFamily: "var(--font-mono)" }}
        >
          0{n}
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 42,
          lineHeight: 1,
          color,
          letterSpacing: "-0.02em",
          marginBottom: 10,
        }}
      >
        <AnimCount to={value} mounted={mounted} />
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{label}</div>
    </div>
  )
}

// ─── Donut (semester split) ──────────────────────────────────────
function SemDonut({
  data,
  mounted,
}: {
  data: StatsData["bySemester"]
  mounted: boolean
}) {
  const sz = 200,
    sw = 38
  const r = (sz - sw) / 2
  const cx = sz / 2,
    cy = sz / 2
  const circ = 2 * Math.PI * r
  const colors = ["#2563eb", "#93c5fd"]
  const total = data.reduce((s, d) => s + d.count, 0)
  const GAP = 5
  let cum = 0
  const slices = data.map((d, i) => {
    const raw = total > 0 ? (d.count / total) * circ : 0
    const s = { ...d, len: Math.max(0, raw - GAP), offset: cum, color: colors[i] ?? colors[0] }
    cum += raw
    return s
  })

  return (
    <div className="ks-card" style={{ padding: "22px 24px", height: "100%", boxSizing: "border-box" }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "var(--ink-3)",
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        01 · ภาคเรียน
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        {/* Donut SVG */}
        <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
          <svg
            width={sz}
            height={sz}
            viewBox={`0 0 ${sz} ${sz}`}
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--surface-2)"
              strokeWidth={sw}
            />
            {slices.map((s, i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={sw}
                strokeLinecap="butt"
                strokeDasharray={mounted ? `${s.len} ${circ}` : `0 ${circ}`}
                strokeDashoffset={-s.offset}
                style={{
                  transition: `stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 0.22}s`,
                }}
              />
            ))}
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 38,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
              }}
            >
              <AnimCount to={total} mounted={mounted} />
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-3)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginTop: 3,
              }}
            >
              รายการ
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, minWidth: 130 }}>
          {slices.length === 0 && (
            <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>
          )}
          {slices.map((s, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 7,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "var(--ink-2)",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: s.color,
                      flexShrink: 0,
                      display: "inline-block",
                    }}
                  />
                  {s.semesterName}
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 28,
                    color: "var(--ink)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  <AnimCount to={s.count} mounted={mounted} />
                </span>
              </div>
              <div style={{ height: 5, background: "var(--surface-2)", borderRadius: 99 }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    background: s.color,
                    width:
                      mounted && total > 0 ? `${(s.count / total) * 100}%` : "0%",
                    transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${0.1 + i * 0.2}s`,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 5,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink-3)",
                }}
              >
                {total > 0 ? ((s.count / total) * 100).toFixed(1) : "0.0"}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Column chart (by category) ─────────────────────────────────
function CatColChart({
  data,
  mounted,
}: {
  data: (StatsData["byCategory"][number] & { color: string })[]
  mounted: boolean
}) {
  const H = 188
  const max = data[0]?.count || 1
  const guides = [0.25, 0.5, 0.75, 1]

  return (
    <div className="ks-card" style={{ padding: "22px 24px" }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "var(--ink-3)",
            textTransform: "uppercase",
            marginBottom: 5,
          }}
        >
          02 · หมวดการผิดระเบียบ
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
          จำนวนบันทึกตามหมวด
        </div>
      </div>
      {data.length === 0 ? (
        <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>
      ) : (
        <div style={{ position: "relative", height: H + 60 }}>
          {guides.map((t) => (
            <div
              key={t}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: H * t + 52,
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <div style={{ flex: 1, borderTop: "1px dashed var(--surface-2)" }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--ink-4)",
                  paddingLeft: 6,
                }}
              >
                {Math.round(max * t)}
              </span>
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 28,
              bottom: 0,
              height: H + 54,
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            {data.map((b, i) => (
              <div
                key={b.categoryId}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--ink-2)",
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  {b.count}
                </div>
                <div style={{ width: "100%", height: H, display: "flex", alignItems: "flex-end" }}>
                  <div
                    style={{
                      width: "100%",
                      height: mounted ? `${(b.count / max) * 100}%` : "1.5%",
                      minHeight: 4,
                      background: b.color,
                      borderRadius: "6px 6px 0 0",
                      transition: `height 0.7s cubic-bezier(0.34,1.38,0.64,1) ${i * 0.07}s`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 10,
                        background: "rgba(255,255,255,0.22)",
                        borderRadius: "6px 6px 0 0",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{ width: "100%", height: 2, background: "var(--surface-2)", margin: "0 0 10px" }}
                />
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ink-3)",
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  {b.categoryName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Trend section: grade level + category momentum ─────────────
function TrendSection({
  byGradeLevel,
  categoryMomentum,
  totalRecords,
  mounted,
}: {
  byGradeLevel: StatsData["byGradeLevel"]
  categoryMomentum: StatsData["categoryMomentum"]
  totalRecords: number
  mounted: boolean
}) {
  const maxGrade = Math.max(...byGradeLevel.map((g) => g.count), 1)

  return (
    <div className="ks-card" style={{ padding: "22px 24px" }}>
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "var(--ink-3)",
            textTransform: "uppercase",
            marginBottom: 3,
          }}
        >
          03 · แนวโน้มและรูปแบบ
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
          วิเคราะห์ตามระดับชั้นและประเภท
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {/* ── Left: Grade level ── */}
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "var(--ink-3)",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            บันทึกตามระดับชั้น
          </div>

          {byGradeLevel.length === 0 ? (
            <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {byGradeLevel.map((g, i) => {
                const pct = totalRecords > 0 ? (g.count / totalRecords) * 100 : 0
                return (
                  <div key={g.gradeLevel} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--ink-2)",
                        flexShrink: 0,
                      }}
                    >
                      {g.gradeLevel}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        height: 22,
                        background: "var(--surface-2)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: mounted ? `${(g.count / maxGrade) * 100}%` : "0%",
                          height: "100%",
                          background: CAT_COLORS[i % CAT_COLORS.length]!,
                          borderRadius: 4,
                          opacity: 0.85,
                          transition: `width 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 0.08}s`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: 26,
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ink-2)",
                        flexShrink: 0,
                      }}
                    >
                      {g.count}
                    </div>
                    <div
                      style={{
                        width: 36,
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        color: "var(--ink-4)",
                        flexShrink: 0,
                      }}
                    >
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right: Category momentum ── */}
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "var(--ink-3)",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            ประเภทที่กำลังเปลี่ยนแปลง
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 16 }}>
            ครึ่งแรก → ครึ่งหลัง ของช่วงเวลาที่เลือก
          </div>

          {categoryMomentum.length === 0 ? (
            <div style={{ color: "var(--ink-4)", fontSize: 13 }}>
              ต้องการข้อมูลอย่างน้อย 3 เดือนเพื่อเปรียบเทียบ
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {categoryMomentum.map((cat) => {
                const rising = cat.delta > 0
                const flat = cat.delta === 0
                const arrowColor = flat ? "var(--ink-4)" : rising ? "#d97706" : "#059669"
                const bgColor = flat
                  ? "var(--surface-2)"
                  : rising
                  ? "rgba(217,119,6,0.12)"
                  : "rgba(5,150,105,0.10)"
                const arrow = flat ? "—" : rising ? "↑" : "↓"
                const deltaLabel = cat.delta > 0 ? `+${cat.delta}` : String(cat.delta)

                return (
                  <div
                    key={cat.categoryId}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 5,
                        flexShrink: 0,
                        background: bgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: arrowColor,
                      }}
                    >
                      {arrow}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: "var(--ink-2)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat.categoryName}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--ink-4)",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat.first} → {cat.second}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: arrowColor,
                        flexShrink: 0,
                        width: 30,
                        textAlign: "right",
                      }}
                    >
                      {flat ? "" : deltaLabel}
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

// ─── Horizontal bar ─────────────────────────────────────────────
function HBar({
  label,
  value,
  max,
  color,
  delay,
  mounted,
  tag,
}: {
  label: string
  value: number
  max: number
  color: string
  delay?: number
  mounted: boolean
  tag?: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 160,
          textAlign: "right",
          fontSize: 12.5,
          color: "var(--ink-2)",
          lineHeight: 1.3,
          flexShrink: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          height: 24,
          background: "var(--surface-2)",
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: mounted ? `${pct}%` : "0%",
            height: "100%",
            background: color,
            borderRadius: 4,
            opacity: 0.86,
            transition: `width 0.55s cubic-bezier(0.4,0,0.2,1) ${delay ?? 0}s`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg,rgba(255,255,255,0) 30%,rgba(255,255,255,0.18) 100%)",
            }}
          />
          {pct > 32 && tag && (
            <div
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 10,
                color: "rgba(255,255,255,0.85)",
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap",
              }}
            >
              {tag}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          width: 30,
          textAlign: "right",
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          color: "var(--ink-2)",
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {value}
      </div>
    </div>
  )
}

// ─── View ① All subs combined ────────────────────────────────────
function AllSubsView({
  data,
  catColors,
  mounted,
}: {
  data: StatsData["bySubCategory"]
  catColors: Map<number, string>
  mounted: boolean
}) {
  const max = data[0]?.count || 1
  const uniqueCats = [...new Map(data.map((d) => [d.categoryId, d])).values()]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12,
          paddingLeft: 174,
        }}
      >
        {uniqueCats.map((d) => (
          <div
            key={d.categoryId}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--ink-3)" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: catColors.get(d.categoryId) ?? "#888",
                display: "inline-block",
              }}
            />
            {d.categoryName}
          </div>
        ))}
      </div>
      {data.map((r, i) => (
        <HBar
          key={r.subId}
          label={r.subName}
          value={r.count}
          max={max}
          color={catColors.get(r.categoryId) ?? "#888"}
          tag={r.categoryName}
          delay={i * 0.022}
          mounted={mounted}
        />
      ))}
    </div>
  )
}

// ─── View ② By category ─────────────────────────────────────────
function ByCatView({
  data,
  catColors,
  mounted,
}: {
  data: StatsData["bySubCategory"]
  catColors: Map<number, string>
  mounted: boolean
}) {
  const grouped = new Map<number, { name: string; items: StatsData["bySubCategory"] }>()
  data.forEach((d) => {
    if (!grouped.has(d.categoryId))
      grouped.set(d.categoryId, { name: d.categoryName, items: [] })
    grouped.get(d.categoryId)!.items.push(d)
  })
  const panels = [...grouped.entries()].slice(0, 6)

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      {panels.map(([catId, { name, items }]) => {
        const max = Math.max(...items.map((s) => s.count))
        const color = catColors.get(catId) ?? "#888"
        return (
          <div key={catId}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}
            >
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 3,
                  background: color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "var(--ink-3)",
                  textTransform: "uppercase",
                }}
              >
                หมวด{name}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "var(--ink-3)",
                  marginLeft: "auto",
                }}
              >
                {items.reduce((s, r) => s + r.count, 0)} รายการ
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {items.map((s, i) => (
                <div key={s.subId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 140,
                      fontSize: 12.5,
                      color: "var(--ink-2)",
                      lineHeight: 1.3,
                      flexShrink: 0,
                    }}
                  >
                    {s.subName}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 20,
                      background: "var(--surface-2)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: mounted && max > 0 ? `${(s.count / max) * 100}%` : "0%",
                        height: "100%",
                        background: color,
                        borderRadius: 3,
                        opacity: 0.78,
                        transition: `width 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 26,
                      textAlign: "right",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--ink-3)",
                      flexShrink: 0,
                    }}
                  >
                    {s.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Top students ────────────────────────────────────────────────
function TopStudents({ data }: { data: StatsData["topStudents"] }) {
  const max = data[0]?.count || 1

  return (
    <div className="ks-card">
      <div
        style={{
          padding: "18px 24px 14px",
          borderBottom: "1px solid var(--surface-2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--ink-3)",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            TOP · นักเรียนที่มีบันทึกมากที่สุด
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
            อันดับนักเรียนบันทึกพฤติกรรม
          </div>
        </div>
      </div>
      <div style={{ padding: "18px 24px 22px" }}>
        {data.length === 0 ? (
          <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>
        ) : (
          data.map((s, i) => (
            <div
              key={s.id}
              style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: i < 3 ? RANK_COLORS[i] : "var(--surface-2)",
                  border: i >= 3 ? "1px solid var(--surface-2)" : "none",
                  color: i < 3 ? "#fff" : "var(--ink-3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--indigo-wash)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--indigo)",
                  flexShrink: 0,
                }}
              >
                {s.firstName?.[0]}
                {s.lastName?.[0]}
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
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "var(--surface-2)",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(s.count / max) * 100}%`,
                      height: "100%",
                      background: RANK_COLORS[i] ?? "var(--surface-2)",
                      borderRadius: 99,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 22,
                    color: RANK_COLORS[i] ?? "var(--ink-3)",
                    letterSpacing: "-0.02em",
                    width: 28,
                    textAlign: "right",
                  }}
                >
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
export function ReportCharts({ initialData }: { initialData: StatsData }) {
  const [data, setData] = useState(initialData)
  const [yearId, setYearId] = useState(String(initialData.academicYears[0]?.id ?? ""))
  const [semesterId, setSemesterId] = useState("all")
  const [viewMode, setViewMode] = useState(1)
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
      const res = await fetch(`/api/reports/stats?${params}`)
      if (res.ok) {
        const next = await res.json()
        setData(next)
        setTimeout(() => setMounted(true), 80)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleYearChange = (v: string) => {
    setYearId(v)
    fetchData(v, semesterId)
  }

  const handleSemesterChange = (v: string) => {
    setSemesterId(v)
    fetchData(yearId, v)
  }

  const resetAnim = (mode: number) => {
    setViewMode(mode)
    setMounted(false)
    setTimeout(() => setMounted(true), 60)
  }

  // Build category color map (stable across re-renders by categoryId position)
  const catColorMap = new Map<number, string>()
  data.byCategory.forEach((c, i) => {
    catColorMap.set(c.categoryId, CAT_COLORS[i % CAT_COLORS.length]!)
  })
  // Also seed from bySubCategory in case category has no direct records
  data.bySubCategory.forEach((d) => {
    if (!catColorMap.has(d.categoryId)) {
      const idx = catColorMap.size % CAT_COLORS.length
      catColorMap.set(d.categoryId, CAT_COLORS[idx]!)
    }
  })

  const subTotal = data.bySubCategory.reduce((s, d) => s + d.count, 0)

  return (
    <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <select
          className="ks-select"
          style={{ width: 168 }}
          value={yearId}
          onChange={(e) => handleYearChange(e.target.value)}
        >
          {data.academicYears.map((y) => (
            <option key={y.id} value={y.id}>
              ปีการศึกษา {y.year}
            </option>
          ))}
        </select>
        <select
          className="ks-select"
          style={{ width: 168 }}
          value={semesterId}
          onChange={(e) => handleSemesterChange(e.target.value)}
        >
          <option value="all">ทุกภาคเรียน</option>
          {data.semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Download size={14} />
            ส่งออก PDF
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KpiCard
          n={1}
          eyebrow="RECORDS"
          value={data.totalRecords}
          label="บันทึกทั้งหมด"
          color="#2563eb"
          mounted={mounted}
        />
        <KpiCard
          n={2}
          eyebrow="STUDENTS"
          value={data.studentCount}
          label="นักเรียนที่มีบันทึก"
          color="#059669"
          mounted={mounted}
        />
        <KpiCard
          n={3}
          eyebrow="PENDING"
          value={data.pending}
          label="รออนุมัติ"
          color="#d97706"
          mounted={mounted}
        />
        <KpiCard
          n={4}
          eyebrow="APPROVED"
          value={data.approved}
          label="อนุมัติแล้ว"
          color="#7c3aed"
          mounted={mounted}
        />
      </div>

      {/* Donut + Column */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 16,
          marginBottom: 24,
          alignItems: "start",
        }}
      >
        <SemDonut data={data.bySemester} mounted={mounted} />
        <CatColChart
          data={data.byCategory.map((c, i) => ({
            ...c,
            color: CAT_COLORS[i % CAT_COLORS.length]!,
          }))}
          mounted={mounted}
        />
      </div>

      {/* Trend */}
      <div style={{ marginBottom: 24 }}>
        <TrendSection
          byGradeLevel={data.byGradeLevel ?? []}
          categoryMomentum={data.categoryMomentum ?? []}
          totalRecords={data.totalRecords}
          mounted={mounted}
        />
      </div>

      {/* Sub-category breakdown */}
      <div className="ks-card" style={{ marginBottom: 24 }}>
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid var(--surface-2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "var(--ink-3)",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              เรื่อง · รายละเอียดการผิดระเบียบ
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
              การผิดระเบียบรายหัวข้อ
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--ink-3)",
                  fontWeight: 400,
                  marginLeft: 8,
                }}
              >
                · รวมทุกหมวด {subTotal} รายการ
              </span>
            </div>
          </div>
          {/* View toggle */}
          <div
            style={{
              display: "flex",
              background: "var(--surface-2)",
              border: "1px solid var(--surface-2)",
              borderRadius: 6,
              padding: 3,
              gap: 3,
            }}
          >
            {[
              { v: 1, label: "① รวมทุกหมวด" },
              { v: 2, label: "② แยกตามหมวด" },
            ].map((b) => (
              <button
                key={b.v}
                onClick={() => resetAnim(b.v)}
                style={{
                  padding: "7px 18px",
                  borderRadius: 4,
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  background: viewMode === b.v ? "var(--surface)" : "transparent",
                  color: viewMode === b.v ? "var(--ink)" : "var(--ink-3)",
                  boxShadow:
                    viewMode === b.v ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>
          {data.bySubCategory.length === 0 ? (
            <div style={{ color: "var(--ink-4)", fontSize: 13 }}>ไม่มีข้อมูล</div>
          ) : viewMode === 1 ? (
            <AllSubsView
              data={data.bySubCategory}
              catColors={catColorMap}
              mounted={mounted}
            />
          ) : (
            <ByCatView
              data={data.bySubCategory}
              catColors={catColorMap}
              mounted={mounted}
            />
          )}
        </div>
      </div>

      {/* Top students */}
      <TopStudents data={data.topStudents} />
    </div>
  )
}
