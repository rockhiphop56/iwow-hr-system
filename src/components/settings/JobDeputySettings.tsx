"use client";

import { useState } from "react";
import type { JobDeputy, Employee } from "@/types/database.types";
import { createJobDeputyAction, updateJobDeputyAction, deleteJobDeputyAction } from "@/app/actions/param-settings.actions";

interface Props {
  deputies: JobDeputy[];
  employees: Pick<Employee, "user_uuid" | "name">[];
}

export function JobDeputySettings({ deputies: initialDeputies, employees }: Props) {
  const [deputies, setDeputies] = useState(initialDeputies);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ original_user_uuid: "", deputy_user_uuid: "", start_date: "", end_date: "", reason: "" });
  const [loading, setLoading] = useState(false);

  const empName = (uuid: string) => employees.find((e) => e.user_uuid === uuid)?.name ?? uuid.slice(0, 8);

  async function handleAdd() {
    setLoading(true);
    const result = await createJobDeputyAction(form);
    if (result.success) {
      setShowAdd(false);
      setForm({ original_user_uuid: "", deputy_user_uuid: "", start_date: "", end_date: "", reason: "" });
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleToggle(id: string, active: boolean) {
    await updateJobDeputyAction(id, { is_active: !active });
    setDeputies(deputies.map((d) => (d.job_deputy_id === id ? { ...d, is_active: !active } : d)));
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此代理設定？")) return;
    await deleteJobDeputyAction(id);
    setDeputies(deputies.filter((d) => d.job_deputy_id !== id));
  }

  return (
    <div>
      <button onClick={() => setShowAdd(true)} className="btn-primary mb-4 text-sm">+ 新增代理人</button>

      {showAdd && (
        <div className="card mb-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">被代理人</label>
              <select className="select-field w-full" value={form.original_user_uuid} onChange={(e) => setForm({ ...form, original_user_uuid: e.target.value })}>
                <option value="">請選擇</option>
                {employees.map((e) => <option key={e.user_uuid} value={e.user_uuid}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">代理人</label>
              <select className="select-field w-full" value={form.deputy_user_uuid} onChange={(e) => setForm({ ...form, deputy_user_uuid: e.target.value })}>
                <option value="">請選擇</option>
                {employees.filter((e) => e.user_uuid !== form.original_user_uuid).map((e) => <option key={e.user_uuid} value={e.user_uuid}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">開始日期</label>
              <input className="input-field w-full" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">結束日期</label>
              <input className="input-field w-full" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <input className="input-field mt-3 w-full" placeholder="代理原因（選填）" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} disabled={loading || !form.original_user_uuid || !form.deputy_user_uuid || !form.start_date || !form.end_date} className="btn-primary text-sm">儲存</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">取消</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="px-4 py-3">被代理人</th>
              <th className="px-4 py-3">代理人</th>
              <th className="px-4 py-3">期間</th>
              <th className="px-4 py-3">原因</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {deputies.map((d) => {
              const today = new Date().toISOString().split("T")[0];
              const isCurrentlyActive = d.is_active && d.start_date <= today && d.end_date >= today;

              return (
                <tr key={d.job_deputy_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{empName(d.original_user_uuid)}</td>
                  <td className="px-4 py-3">{empName(d.deputy_user_uuid)}</td>
                  <td className="px-4 py-3 text-gray-400">{d.start_date} ~ {d.end_date}</td>
                  <td className="px-4 py-3 text-gray-400">{d.reason ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${isCurrentlyActive ? "bg-emerald-400/10 text-emerald-400" : "bg-gray-400/10 text-gray-400"}`}>
                      {isCurrentlyActive ? "代理中" : d.is_active ? "待生效" : "已停用"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleToggle(d.job_deputy_id, d.is_active)} className="text-xs text-gray-400 hover:text-white">{d.is_active ? "停用" : "啟用"}</button>
                      <button onClick={() => handleDelete(d.job_deputy_id)} className="text-xs text-red-400 hover:text-red-300">刪除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {deputies.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">尚無代理人設定</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
