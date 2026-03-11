"use client";

import { useState } from "react";
import type { JobRole } from "@/types/database.types";
import { createJobRoleAction, updateJobRoleAction, deleteJobRoleAction } from "@/app/actions/settings.actions";

interface Props {
  roles: JobRole[];
}

export function JobRoleSettings({ roles: initialRoles }: Props) {
  const [roles, setRoles] = useState(initialRoles);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ role_name: "", job_level: 1, description: "" });
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);
    const result = await createJobRoleAction(form);
    if (result.success) {
      setShowAdd(false);
      setForm({ role_name: "", job_level: 1, description: "" });
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此職務？")) return;
    await deleteJobRoleAction(id);
    setRoles(roles.filter((r) => r.role_id !== id));
  }

  async function handleToggle(id: string, active: boolean) {
    await updateJobRoleAction(id, { is_active: !active });
    setRoles(roles.map((r) => (r.role_id === id ? { ...r, is_active: !active } : r)));
  }

  return (
    <div>
      <button onClick={() => setShowAdd(true)} className="btn-primary mb-4 text-sm">
        + 新增職務
      </button>

      {showAdd && (
        <div className="card mb-4 p-4">
          <div className="grid grid-cols-3 gap-3">
            <input className="input-field" placeholder="職務名稱" value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })} />
            <input className="input-field" type="number" placeholder="職等級別" value={form.job_level} onChange={(e) => setForm({ ...form, job_level: Number(e.target.value) })} />
            <input className="input-field" placeholder="說明（選填）" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} disabled={loading || !form.role_name} className="btn-primary text-sm">儲存</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">取消</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="px-4 py-3">職務名稱</th>
              <th className="px-4 py-3">職等</th>
              <th className="px-4 py-3">說明</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.role_id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{role.role_name}</td>
                <td className="px-4 py-3">{role.job_level}</td>
                <td className="px-4 py-3 text-gray-400">{role.description ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${role.is_active ? "bg-emerald-400/10 text-emerald-400" : "bg-gray-400/10 text-gray-400"}`}>
                    {role.is_active ? "啟用" : "停用"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleToggle(role.role_id, role.is_active)} className="text-xs text-gray-400 hover:text-white">
                      {role.is_active ? "停用" : "啟用"}
                    </button>
                    <button onClick={() => handleDelete(role.role_id)} className="text-xs text-red-400 hover:text-red-300">刪除</button>
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">尚無職務資料</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
