"use client"

type Props = {
  onSelect: (username: string, password: string) => void
}

const ROLES = [
  { label: "ผอ",          sub: "DIRECTOR",    username: "prasert",   password: "prasert123"   },
  { label: "รองผอ",       sub: "VICE_DIR",    username: "suree",     password: "suree123"     },
  { label: "ครูปกครอง",  sub: "DISCIPLINE",  username: "anan",      password: "anan123"      },
  { label: "หน.ม.1",     sub: "TEACHER",     username: "somchai",   password: "somchai123"   },
  { label: "หน.ม.2",     sub: "TEACHER",     username: "wipa",      password: "wipa123"      },
  { label: "หน.ม.3",     sub: "TEACHER",     username: "malee",     password: "malee123"     },
  { label: "หน.ม.4",     sub: "TEACHER",     username: "pimjai",    password: "pimjai123"    },
  { label: "หน.ม.5",     sub: "TEACHER",     username: "wichai",    password: "wichai123"    },
  { label: "หน.ม.6",     sub: "TEACHER",     username: "sommai",    password: "sommai123"    },
  { label: "Admin",       sub: "ADMIN",       username: "thanakorn", password: "thanakorn123" },
  { label: "Super Admin", sub: "SUPER",       username: "admin",     password: "admin123"     },
]

export function DevRolePicker({ onSelect }: Props) {
  if (process.env.NEXT_PUBLIC_DEV_ROLE_PICKER !== "true") return null

  return (
    <div
      style={{
        marginBottom: 20,
        padding: "10px 12px",
        border: "1px solid var(--amber)",
        borderRadius: "var(--radius)",
        background: "var(--amber-soft)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          background: "var(--amber)", color: "#fff",
          padding: "2px 7px", borderRadius: 999,
        }}>
          DEV
        </span>
        <span style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 500 }}>
          เลือก Role ทดสอบ
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {ROLES.map((r) => (
          <button
            key={r.username}
            type="button"
            onClick={() => onSelect(r.username, r.password)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              padding: "4px 10px",
              background: "var(--surface)", color: "var(--ink)",
              border: "1px solid var(--rule-2)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer", textAlign: "left",
              transition: "border-color 0.12s, background 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--amber)"
              ;(e.currentTarget as HTMLButtonElement).style.background = "var(--amber-wash)"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--rule-2)"
              ;(e.currentTarget as HTMLButtonElement).style.background = "var(--surface)"
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{r.label}</span>
            <span style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: "var(--font-mono)", lineHeight: 1.3 }}>
              {r.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
