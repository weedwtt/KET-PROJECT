"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Calendar, Loader2 } from "lucide-react"

type AcademicYear = { id: number; year: number }

export default function AcademicYearMasterPage() {
  const [items, setItems] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/master/academic-years")
    setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!year.trim()) return
    setSaving(true)
    await fetch("/api/master/academic-years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: Number(year) }),
    })
    setYear("")
    await load()
    setSaving(false)
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    await fetch(`/api/master/academic-years/${id}`, { method: "DELETE" })
    await load()
    setDeletingId(null)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#2D1B00]">จัดการปีการศึกษา</h1>
        <p className="text-sm text-gray-400 mt-0.5">ตารางข้อมูลหลัก — ปีการศึกษา (พ.ศ.)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-6 py-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#F5A623]" />
          <h2 className="text-sm font-bold text-[#2D1B00]">รายการปีการศึกษา</h2>
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
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ปีการศึกษา (พ.ศ.)</th>
                <th className="w-14" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-6 py-3 text-gray-400">{item.id}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{item.year}</td>
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
          <div className="flex-1 max-w-xs">
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              ปีการศึกษา (พ.ศ.) <span className="text-red-400">*</span>
            </label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              type="number"
              placeholder="เช่น 2569"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 focus:border-[#F5A623]"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !year.trim()}
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
