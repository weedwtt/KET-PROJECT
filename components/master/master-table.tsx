"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Check } from "lucide-react"

export type FieldConfig = {
  key: string
  label: string
  type?: "text" | "number"
  placeholder?: string
  width?: string
}

interface MasterTableProps<T extends { id: number }> {
  data: T[]
  columns: { key: keyof T; label: string; render?: (row: T) => React.ReactNode }[]
  fields: FieldConfig[]
  total: number
  page: number
  totalPages: number
  search: string
  pageSize: number
  apiBase: string
  searchPlaceholder?: string
  emptyText?: string
}

export function MasterTable<T extends { id: number }>({
  data,
  columns,
  fields,
  total,
  page,
  totalPages,
  search: initialSearch,
  pageSize,
  apiBase,
  searchPlaceholder = "ค้นหา...",
  emptyText = "ยังไม่มีข้อมูล",
}: MasterTableProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [searchValue, setSearchValue] = useState(initialSearch)
  const [showAdd, setShowAdd] = useState(false)
  const [addValues, setAddValues] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function navigate(newPage: number, newSearch: string) {
    const params = new URLSearchParams()
    if (newSearch) params.set("search", newSearch)
    if (newPage > 1) params.set("page", String(newPage))
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ""}`)
    router.refresh()
  }

  function onSearchChange(val: string) {
    setSearchValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(1, val), 400)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addValid) return
    setAdding(true)
    const body: Record<string, string | number> = {}
    fields.forEach((f) => {
      body[f.key] = f.type === "number" ? Number(addValues[f.key] ?? "") : (addValues[f.key] ?? "")
    })
    await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setAdding(false)
    setAddValues({})
    setShowAdd(false)
    router.refresh()
  }

  function startEdit(row: T) {
    setEditingId(row.id)
    const vals: Record<string, string> = {}
    fields.forEach((f) => { vals[f.key] = String((row as Record<string, unknown>)[f.key] ?? "") })
    setEditValues(vals)
  }

  async function handleSaveEdit(id: number) {
    setSaving(true)
    const body: Record<string, string | number> = {}
    fields.forEach((f) => {
      body[f.key] = f.type === "number" ? Number(editValues[f.key] ?? "") : (editValues[f.key] ?? "")
    })
    await fetch(`${apiBase}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(id: number) {
    if (!confirm("ยืนยันการลบรายการนี้? ไม่สามารถกู้คืนได้")) return
    setDeletingId(id)
    await fetch(`${apiBase}/${id}`, { method: "DELETE" })
    setDeletingId(null)
    router.refresh()
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const addValid = fields.every((f) => (addValues[f.key] ?? "").toString().trim())

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="ks-input"
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
        <button
          className={`btn ${showAdd ? "btn-secondary" : "btn-primary"}`}
          onClick={() => setShowAdd((v) => !v)}
        >
          {showAdd ? <X size={14} /> : <Plus size={14} />}
          {showAdd ? "ยกเลิก" : "เพิ่มรายการ"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          style={{
            marginBottom: 18, padding: "18px 20px",
            background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)",
            borderRadius: "var(--radius-lg)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end",
          }}
        >
          {fields.map((f) => (
            <div key={f.key} style={{ flex: "1 1 160px" }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-2)", display: "block", marginBottom: 5 }}>
                {f.label} <span style={{ color: "var(--rose)" }}>*</span>
              </label>
              <input
                className="ks-input"
                type={f.type ?? "text"}
                value={addValues[f.key] ?? ""}
                onChange={(e) => setAddValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={adding || !addValid}>
            {adding
              ? <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <Plus size={14} />}
            เพิ่ม
          </button>
        </form>
      )}

      {/* Table */}
      <div className="ks-card" style={{ overflow: "hidden" }}>
        <table className="ks-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>ลำดับ</th>
              {columns.map((col) => (
                <th key={String(col.key)}>{col.label}</th>
              ))}
              <th className="col-actions">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2}>
                  <div className="empty-state">
                    {initialSearch || searchValue ? "ไม่พบรายการที่ค้นหา" : emptyText}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id}>
                  <td className="mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>{start + idx}</td>
                  {columns.map((col) => (
                    <td key={String(col.key)}>
                      {editingId === row.id && fields.some((f) => f.key === col.key) ? (
                        <input
                          className="ks-input"
                          type={fields.find((f) => f.key === col.key)?.type ?? "text"}
                          value={editValues[col.key as string] ?? ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, [col.key as string]: e.target.value }))}
                          autoFocus={fields[0].key === col.key}
                          style={{ height: 34, padding: "0 10px" }}
                        />
                      ) : col.render ? (
                        col.render(row)
                      ) : (
                        <span style={{ fontWeight: 500 }}>{String((row as Record<string, unknown>)[col.key as string] ?? "")}</span>
                      )}
                    </td>
                  ))}
                  <td className="col-actions">
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      {editingId === row.id ? (
                        <>
                          <button
                            className="btn btn-primary btn-sm btn-icon"
                            onClick={() => handleSaveEdit(row.id)}
                            disabled={saving}
                            title="บันทึก"
                            style={{ background: "var(--sage)" }}
                          >
                            {saving
                              ? <svg className="spin" width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              : <Check size={12} />}
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingId(null)} title="ยกเลิก">
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(row)} title="แก้ไข">
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => handleDelete(row.id)}
                            disabled={deletingId === row.id}
                            title="ลบ"
                            style={{ color: "var(--rose)" }}
                          >
                            {deletingId === row.id
                              ? <svg className="spin" width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              : <Trash2 size={13} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination">
          <span style={{ flex: 1 }}>
            แสดง <span className="mono">{start}–{end}</span> จาก <span className="mono">{total}</span> รายการ
          </span>
          <button className={`page-btn ${page === 1 ? "disabled" : ""}`} onClick={() => page > 1 && navigate(page - 1, searchValue)}>
            <ChevronLeft size={12} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…")
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`e-${i}`} style={{ padding: "0 4px", color: "var(--ink-4)" }}>…</span>
              ) : (
                <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => navigate(p as number, searchValue)}>
                  {p}
                </button>
              )
            )}
          <button className={`page-btn ${page === totalPages ? "disabled" : ""}`} onClick={() => page < totalPages && navigate(page + 1, searchValue)}>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
