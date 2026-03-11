"use client";

import { useState } from "react";
import type { JobGrade } from "@/types/database.types";
import { createJobGradeAction, updateJobGradeAction, deleteJobGradeAction } from "@/app/actions/param-settings.actions";

interface Props {
  grades: JobGrade[];
}

export function JobGradeSettings({ grades: initialGrades }: Props) {
  const [grades, setGrades] = useState(initialGrades);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ grade_name: "", grade_code: "", grade_rank: 1, description: "" });
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);
    const result = await createJobGradeAction(form);
    if (result.success) {
      setShowAdd(false);
      setForm({ grade_name: "", grade_code: "", grade_rank: 1, description: "" });
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此職等？")) return;
    await deleteJobGradeAction(id);
    setGrades(grades.filter((g) => g.grade_id !== id));
  }

  async function handleToggle(id: string, active: boolean) {
    await updateJobGradeAction(id, { is_active: !active });
    setGrades(grades.map((g) => (g.grade_id === id ? { ...g, is_active: !active } : g)));
  }

  return (
    <div>
      <button onClick={() => setShowAdd(true)} className="btn-primary mb-4 text-sm">+ 新增職等</button>

      {showAdd && (
        <div className="card mb-4 p-4">
          <div className="grid grid-cols-4 gap-3">
            <input className="input-field" placeholder="職等名稱" value={form.grade_name} onChange={(e) => setForm({ ...form, grade_name: e.target.value })} />
            <input className="input-field" placeholder="代碼" value={form.grade_code} onChange={(e) => setForm({ ...form, grade_code: e.target.value })} />
            <input className="input-field" type="number" placeholder="排序" value={form.grade_rank} onChange={(e) => setForm({ ...form, grade_rank: Number(e.target.value) })} />
            <input className="input-field" placeholder="說明（選填）" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} disabled={loading || !form.grade_name || !form.grade_code} className="btn-primary text-sm">儲存</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">取消</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="px-4 py-3">職等名稱</th>
              <th className="px-4 py-3">代碼</th>
              <th className="px-4 py-3">排序</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.grade_id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{g.grade_name}</td>
                <td className="px-4 py-3 text-gray-400">{g.grade_code}</td>
                <td className="px-4 py-3">{g.grade_rank}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${g.is_active ? "bg-emerald-400/10 text-emerald-400" : "bg-gray-400/10 text-gray-400"}`}>
                    {g.is_active ? "啟用" : "停用"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleToggle(g.grade_id, g.is_active)} className="text-xs text-gray-400 hover:text-white">{g.is_active ? "停用" : "啟用"}</button>
                    <button onClick={() => handleDelete(g.grade_id)} className="text-xs text-red-400 hover:text-red-300">刪除</button>
                  </div>
                </td>
              </tr>
            ))}
            {grades.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">尚無職等資料</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
