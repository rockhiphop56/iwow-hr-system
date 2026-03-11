"use client";

import { useState } from "react";
import type { ApprovalType } from "@/types/database.types";
import { createApprovalTypeAction, updateApprovalTypeAction } from "@/app/actions/approval.actions";

interface Props {
  types: ApprovalType[];
}

export function ApprovalTypeSettings({ types: initialTypes }: Props) {
  const [types, setTypes] = useState(initialTypes);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type_key: "", type_name: "", description: "" });
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);
    const result = await createApprovalTypeAction(form);
    if (result.success) {
      setShowAdd(false);
      setForm({ type_key: "", type_name: "", description: "" });
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleToggle(id: string, active: boolean) {
    await updateApprovalTypeAction(id, { is_active: !active });
    setTypes(types.map((t) => (t.approval_type_id === id ? { ...t, is_active: !active } : t)));
  }

  return (
    <div>
      <button onClick={() => setShowAdd(true)} className="btn-primary mb-4 text-sm">+ 新增簽核類型</button>

      {showAdd && (
        <div className="card mb-4 p-4">
          <div className="grid grid-cols-3 gap-3">
            <input className="input-field" placeholder="類型代碼（如 transfer）" value={form.type_key} onChange={(e) => setForm({ ...form, type_key: e.target.value })} />
            <input className="input-field" placeholder="類型名稱" value={form.type_name} onChange={(e) => setForm({ ...form, type_name: e.target.value })} />
            <input className="input-field" placeholder="說明（選填）" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} disabled={loading || !form.type_key || !form.type_name} className="btn-primary text-sm">儲存</button>
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
              <th className="px-4 py-3">說明</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.approval_type_id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{t.type_name}</td>
                <td className="px-4 py-3 font-mono text-gray-400">{t.type_key}</td>
                <td className="px-4 py-3 text-gray-400">{t.description ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${t.is_active ? "bg-emerald-400/10 text-emerald-400" : "bg-gray-400/10 text-gray-400"}`}>
                    {t.is_active ? "啟用" : "停用"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(t.approval_type_id, t.is_active)} className="text-xs text-gray-400 hover:text-white">
                    {t.is_active ? "停用" : "啟用"}
                  </button>
                </td>
              </tr>
            ))}
            {types.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">尚無簽核類型</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
