"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Check } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

type Category = { id: number; name: string }
type SubCategory = {
  id: number
  name: string
  violationCategoryId: number
  violationCategory: { id: number; name: string }
}

interface Props {
  data: SubCategory[]
  categories: Category[]
  total: number
  page: number
  totalPages: number
  search: string
  pageSize: number
}

export function ViolationSubCategoryTable({ data, categories, total, page, totalPages, search: initialSearch, pageSize }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [searchValue, setSearchValue] = useState(initialSearch)
  const [filterCategoryId, setFilterCategoryId] = useState("")

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState("")
  const [addCategoryId, setAddCategoryId] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState("")

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editCategoryId, setEditCategoryId] = useState("")
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function navigate(newPage: number, newSearch: string, catId?: string) {
    const params = new URLSearchParams()
    if (newSearch) params.set("search", newSearch)
    if (newPage > 1) params.set("page", String(newPage))
    const cat = catId !== undefined ? catId : filterCategoryId
    if (cat) params.set("categoryId", cat)
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ""}`)
  }

  function onSearchChange(val: string) {
    setSearchValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(1, val), 400)
  }

  function onFilterCategory(val: string) {
    setFilterCategoryId(val)
    navigate(1, searchValue, val)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError("")
    if (!addName.trim() || !addCategoryId) {
      setAddError("กรุณาเลือกหมวดหลักและกรอกชื่อหมวดย่อย")
      return
    }
    setAdding(true)
    const res = await fetch("/api/master/violation-sub-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName.trim(), violationCategoryId: Number(addCategoryId) }),
    })
    setAdding(false)
    if (!res.ok) {
      setAddError("เกิดข้อผิดพลาด กรุณาลองใหม่")
      return
    }
    setAddName("")
    setAddCategoryId("")
    setShowAdd(false)
    router.refresh()
  }

  function startEdit(row: SubCategory) {
    setEditingId(row.id)
    setEditName(row.name)
    setEditCategoryId(String(row.violationCategoryId))
  }

  async function handleSaveEdit(id: number) {
    setSaving(true)
    await fetch(`/api/master/violation-sub-categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), violationCategoryId: Number(editCategoryId) }),
    })
    setSaving(false)
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    await fetch(`/api/master/violation-sub-categories/${id}`, { method: "DELETE" })
    setDeletingId(null)
    router.refresh()
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div>
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="ks-input"
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อหมวดย่อย..."
          />
        </div>
        <select
          className="ks-select"
          value={filterCategoryId}
          onChange={(e) => onFilterCategory(e.target.value)}
          style={{ width: "auto" }}
        >
          <option value="">ทุกหมวดหลัก</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        <button
          className={`btn ${showAdd ? "btn-secondary" : "btn-primary"}`}
          onClick={() => { setShowAdd((v) => !v); setAddError("") }}
        >
          {showAdd ? <X size={14} /> : <Plus size={14} />}
          {showAdd ? "ยกเลิก" : "เพิ่มหมวดย่อย"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          style={{ marginBottom: 18, padding: "18px 20px", background: "var(--indigo-wash)", border: "1px solid var(--periwinkle)", borderRadius: "var(--radius-lg)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}
        >
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-2)", display: "block", marginBottom: 5 }}>
              หมวดหลัก <span style={{ color: "var(--rose)" }}>*</span>
            </label>
            <select
              className="ks-select"
              value={addCategoryId}
              onChange={(e) => setAddCategoryId(e.target.value)}
            >
              <option value="">เลือกหมวดหลัก</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "2 1 280px" }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-2)", display: "block", marginBottom: 5 }}>
              ชื่อหมวดย่อย <span style={{ color: "var(--rose)" }}>*</span>
            </label>
            <input
              className="ks-input"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="เช่น มาสาย"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={adding}>
            {adding
              ? <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <Plus size={14} />}
            เพิ่ม
          </button>
          {addError && <div style={{ width: "100%", fontSize: 12.5, color: "var(--rose)" }}>{addError}</div>}
        </form>
      )}

      <div className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead style={{ width: 50 }}>ลำดับ</TableHead>
              <TableHead>หมวดหลัก</TableHead>
              <TableHead>ชื่อหมวดย่อย</TableHead>
              <TableHead className="text-right w-px whitespace-nowrap">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4}>
                  <div className="empty-state">
                    {initialSearch || searchValue || filterCategoryId ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีข้อมูลหมวดย่อย"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell className="mono text-[var(--ink-3)] text-[12px]">{start + idx}</TableCell>
                  <TableCell>
                    {editingId === row.id ? (
                      <select
                        className="ks-select"
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        style={{ height: 34 }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="chip chip-approved" style={{ fontSize: 11 }}>{row.violationCategory.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === row.id ? (
                      <input
                        className="ks-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        style={{ height: 34 }}
                      />
                    ) : (
                      <span style={{ fontWeight: 500 }}>{row.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right w-px whitespace-nowrap">
                    <div style={{ display: "flex", gap: 4 }}>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

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
