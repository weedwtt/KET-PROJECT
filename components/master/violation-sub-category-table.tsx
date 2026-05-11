"use client"

import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Check, Loader2, ChevronDown } from "lucide-react"

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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อหมวดย่อย..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/40 focus:border-[#465fff]"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={filterCategoryId}
            onChange={(e) => onFilterCategory(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/40 focus:border-[#465fff] bg-white text-gray-700 cursor-pointer"
          >
            <option value="">ทุกหมวดหลัก</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        <button
          onClick={() => { setShowAdd((v) => !v); setAddError("") }}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#465fff] hover:bg-[#3a4fd4] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? "ยกเลิก" : "เพิ่มหมวดย่อย"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-[#eff2ff] border border-[#465fff]/20 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-[#1c2434]">เพิ่มหมวดย่อยใหม่</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">หมวดหลัก <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={addCategoryId}
                  onChange={(e) => setAddCategoryId(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff] bg-white"
                >
                  <option value="">เลือกหมวดหลัก</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">ชื่อหมวดย่อย <span className="text-red-400">*</span></label>
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="เช่น มาสาย"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30 focus:border-[#465fff]"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-2 px-4 py-2 bg-[#465fff] hover:bg-[#3a4fd4] disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              เพิ่ม
            </button>
          </div>
          {addError && <p className="text-xs text-red-500">{addError}</p>}
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 w-12">ลำดับ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">หมวดหลัก</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อหมวดย่อย</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-gray-400">
                    {initialSearch || searchValue || filterCategoryId ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีข้อมูลหมวดย่อย"}
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-[#eff2ff]/30 transition-colors">
                    <td className="px-5 py-3 text-gray-400 tabular-nums">{start + idx}</td>
                    <td className="px-4 py-3">
                      {editingId === row.id ? (
                        <div className="relative">
                          <select
                            value={editCategoryId}
                            onChange={(e) => setEditCategoryId(e.target.value)}
                            className="w-full appearance-none pl-3 pr-7 py-1.5 text-sm border border-[#465fff]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={String(c.id)}>{c.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-[#eff2ff] text-[#3a4fd4] text-xs font-medium rounded-full">
                          {row.violationCategory.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {editingId === row.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm border border-[#465fff]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#465fff]/30"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">{row.name}</span>
                      )}
                    </td>
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
                              className="p-1.5 rounded-md text-gray-400 hover:text-[#465fff] hover:bg-[#eff2ff] transition-colors cursor-pointer"
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
                      page === p ? "bg-[#465fff] text-white" : "text-gray-600 hover:bg-gray-100"
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
