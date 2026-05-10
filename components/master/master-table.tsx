"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Check, Loader2 } from "lucide-react"

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

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [addValues, setAddValues] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function navigate(newPage: number, newSearch: string) {
    const params = new URLSearchParams()
    if (newSearch) params.set("search", newSearch)
    if (newPage > 1) params.set("page", String(newPage))
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ""}`)
  }

  function onSearchChange(val: string) {
    setSearchValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(1, val), 400)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
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
    setDeletingId(id)
    await fetch(`${apiBase}/${id}`, { method: "DELETE" })
    setDeletingId(null)
    router.refresh()
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const addValid = fields.every((f) => (addValues[f.key] ?? "").toString().trim())

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623]"
          />
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#F5A623] hover:bg-[#e09518] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? "ยกเลิก" : "เพิ่มรายการ"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-[#2D1B00]">เพิ่มรายการใหม่</p>
          <div className="flex flex-wrap gap-3 items-end">
            {fields.map((f) => (
              <div key={f.key} className={f.width ?? "flex-1 min-w-[140px]"}>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  {f.label} <span className="text-red-400">*</span>
                </label>
                <input
                  type={f.type ?? "text"}
                  value={addValues[f.key] ?? ""}
                  onChange={(e) => setAddValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={adding || !addValid}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5A623] hover:bg-[#e09518] disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              เพิ่ม
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 w-12">ลำดับ</th>
                {columns.map((col) => (
                  <th key={String(col.key)} className="text-left px-4 py-3 font-semibold text-gray-600">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="text-center py-16 text-gray-400">
                    {initialSearch || searchValue ? "ไม่พบรายการที่ค้นหา" : emptyText}
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-5 py-3 text-gray-400 tabular-nums">{start + idx}</td>
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3 text-gray-800">
                        {editingId === row.id && fields.some((f) => f.key === col.key) ? (
                          <input
                            type={fields.find((f) => f.key === col.key)?.type ?? "text"}
                            value={editValues[col.key as string] ?? ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({ ...prev, [col.key as string]: e.target.value }))
                            }
                            className="w-full px-3 py-1.5 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30"
                            autoFocus={fields[0].key === col.key}
                          />
                        ) : col.render ? (
                          col.render(row)
                        ) : (
                          <span className="font-medium">{String((row as Record<string, unknown>)[col.key as string] ?? "")}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {editingId === row.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(row.id)}
                              disabled={saving}
                              className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                              title="บันทึก"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
                              title="ยกเลิก"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(row)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-[#F5A623] hover:bg-amber-50 transition-colors cursor-pointer"
                              title="แก้ไข"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              disabled={deletingId === row.id}
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                              title="ลบ"
                            >
                              {deletingId === row.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
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
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            แสดง {start}–{end} จาก {total} รายการ
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(page - 1, searchValue)}
              disabled={page === 1}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
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
                  <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => navigate(p as number, searchValue)}
                    className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      page === p ? "bg-[#F5A623] text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => navigate(page + 1, searchValue)}
              disabled={page === totalPages}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
