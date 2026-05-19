"use client"

import { useState } from "react"
import { ReportCharts, type StatsData } from "@/components/report-charts"
import { BondReportCharts, type BondStatsData } from "@/components/bond-report-charts"

const TABS = [
  { id: "statement" as const, label: "รายงานบันทึกถ้อยคำนักเรียน" },
  { id: "bond" as const, label: "รายงานบันทึกทัณฑ์บน" },
]

export function ReportTabContainer({
  statInitial,
  bondInitial,
}: {
  statInitial: StatsData
  bondInitial: BondStatsData
}) {
  const [tab, setTab] = useState<"statement" | "bond">("statement")

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 28,
          borderBottom: "2px solid var(--surface-2)",
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 22px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? "var(--indigo)" : "var(--ink-3)",
                borderBottom: active ? "2px solid var(--indigo)" : "2px solid transparent",
                marginBottom: -2,
                transition: "color 0.15s, border-color 0.15s",
                letterSpacing: active ? "-0.01em" : undefined,
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === "statement" ? (
        <ReportCharts initialData={statInitial} />
      ) : (
        <BondReportCharts initialData={bondInitial} />
      )}
    </div>
  )
}
