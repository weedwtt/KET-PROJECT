"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, ShieldAlert, Loader2 } from "lucide-react"

type ViolationCategory = { id: number; name: string }

export default function ViolationCategoryMasterPage() {
  const [items, setItems] = useState<ViolationCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/master/violation-categories")
    setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await fetch("/api/master/violation-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })
    setName("")
    await load()
    setSaving(false)
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    await fetch(`/api/master/violation-categories/${id}`, { method: "DELETE" })
    await load()
    setDeletingId(null)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#2D1B00]">จัดการหมวดการผิดระเบียบ</h1>
        <p className="text-sm text-gray-400 mt-0.5">ตารางข้อมูลหลัก — หมวดการผิดระเบียบ</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#F5A623]" />
          <h2 className="text-sm font-bold text-[#2D1B00]">รายการหมวดการผิดระเบียบ</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-[#F5A623]" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 w-12">#</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ชื่อหมวด</th>
                <th className="w-14" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-6 py-3 text-gray-400">{item.id}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === item.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-400 text-sm">ยังไม่มีข้อมูล</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <form onSubmit={handleAdd} className="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              ชื่อหมวด <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น หมวดที่ 1 ความประพฤติและมารยาท"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#F5A623] hover:bg-[#e09518] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            เพิ่ม
          </button>
        </form>
      </div>
    </div>
  )
}
