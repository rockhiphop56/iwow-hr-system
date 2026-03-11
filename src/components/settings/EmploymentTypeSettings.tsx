"use client";

import { useState } from "react";
import type { EmploymentType } from "@/types/database.types";
import { createEmploymentTypeAction, updateEmploymentTypeAction, deleteEmploymentTypeAction } from "@/app/actions/param-settings.actions";

interface Props {
  types: EmploymentType[];
}

export function EmploymentTypeSettings({ types: initialTypes }: Props) {
  const [types, setTypes] = useState(initialTypes);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type_name: "", type_code: "", is_contractor: false, description: "", sort_order: 0 });
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);
    const result = await createEmploymentTypeAction(form);
    if (result.success) {
      setShowAdd(false);
      setForm({ type_name: "", type_code: "", is_contractor: false, description: "", sort_order: 0 });
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此僱用類型？")) return;
    await deleteEmploymentTypeAction(id);
    setTypes(types.filter((t) => t.employment_type_id !== id));
  }

  async function handleToggle(id: string, active: boolean) {
    await updateEmploymentTypeAction(id, { is_active: !active });
    setTypes(types.map((t) => (t.employment_type_id === id ? { ...t, is_active: !active } : t)));
  }

  return (
    <div>
      <button onClick={() => setShowAdd(true)} className="btn-primary mb-4 text-sm">+ 新增僱用類型</button>

      {showAdd && (
        <div className="card mb-4 p-4">
          <div className="grid grid-cols-3 gap-3">
            <input className="input-field" placeholder="類型名稱" value={form.type_name} onChange={(e) => setForm({ ...form, type_name: e.target.value })} />
            <input className="input-field" placeholder="代碼（如 full_time）" value={form.type_code} onChange={(e) => setForm({ ...form, type_code: e.target.value })} />
            <input className="input-field" placeholder="說明（選填）" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.is_contractor} onChange={(e) => setForm({ ...form, is_contractor: e.target.checked })} className="rounded border-gray-600" />
            承攬類型（使用承攬開始/結束日期，非到職日）
          </label>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} disabled={loading || !form.type_name || !form.type_code} className="btn-primary text-sm">儲存</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">取消</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="px-4 py-3">名稱</th>
              <th className="px-4 py-3">代碼</th>
              <th className="px-4 py-3">類型</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.employment_type_id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{t.type_name}</td>
                <td className="px-4 py-3 text-gray-400">{t.type_code}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${t.is_contractor ? "bg-orange-400/10 text-orange-400" : "bg-blue-400/10 text-blue-400"}`}>
                    {t.is_contractor ? "承攬" : "勞僱"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${t.is_active ? "bg-emerald-400/10 text-emerald-400" : "bg-gray-400/10 text-gray-400"}`}>
                    {t.is_active ? "啟用" : "停用"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleToggle(t.employment_type_id, t.is_active)} className="text-xs text-gray-400 hover:text-white">{t.is_active ? "停用" : "啟用"}</button>
                    <button onClick={() => handleDelete(t.employment_type_id)} className="text-xs text-red-400 hover:text-red-300">刪除</button>
                  </div>
                </td>
              </tr>
            ))}
            {types.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">尚無僱用類型</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
