"use client";

import { useState } from "react";
import type { AccessRole, Permission, DataScope } from "@/types/database.types";
import { createAccessRoleAction, updateAccessRoleAction } from "@/app/actions/role-management.actions";

interface Props {
  roles: AccessRole[];
  permissions: Permission[];
}

const SCOPE_LABELS: Record<DataScope, string> = {
  all: "全租戶",
  department: "部門",
  mentorship: "師徒",
  self: "僅自己",
};

export function RoleManagement({ roles: initialRoles, permissions }: Props) {
  const [roles, setRoles] = useState(initialRoles);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ role_name: "", role_code: "", data_scope: "self" as DataScope, description: "" });
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);
    const result = await createAccessRoleAction(form);
    if (result.success) {
      setShowAdd(false);
      setForm({ role_name: "", role_code: "", data_scope: "self", description: "" });
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleToggle(id: string, active: boolean) {
    await updateAccessRoleAction(id, { is_active: !active });
    setRoles(roles.map((r) => (r.access_role_id === id ? { ...r, is_active: !active } : r)));
  }

  // 按 category 分組權限
  const permsByCategory = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div>
      <button onClick={() => setShowAdd(true)} className="btn-primary mb-4 text-sm">+ 新增角色</button>

      {showAdd && (
        <div className="card mb-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" placeholder="角色名稱" value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })} />
            <input className="input-field" placeholder="代碼" value={form.role_code} onChange={(e) => setForm({ ...form, role_code: e.target.value })} />
            <select className="select-field" value={form.data_scope} onChange={(e) => setForm({ ...form, data_scope: e.target.value as DataScope })}>
              <option value="self">僅自己</option>
              <option value="mentorship">師徒</option>
              <option value="department">部門</option>
              <option value="all">全租戶</option>
            </select>
            <input className="input-field" placeholder="說明（選填）" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} disabled={loading || !form.role_name || !form.role_code} className="btn-primary text-sm">儲存</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">取消</button>
          </div>
        </div>
      )}

      {/* 角色列表 */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="px-4 py-3">角色</th>
              <th className="px-4 py-3">代碼</th>
              <th className="px-4 py-3">資料範圍</th>
              <th className="px-4 py-3">系統</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.access_role_id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{role.role_name}</td>
                <td className="px-4 py-3 text-gray-400">{role.role_code}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary-400/10 px-2 py-0.5 text-xs text-primary-400">
                    {SCOPE_LABELS[role.data_scope]}
                  </span>
                </td>
                <td className="px-4 py-3">{role.is_system ? "✓" : "-"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${role.is_active ? "bg-emerald-400/10 text-emerald-400" : "bg-gray-400/10 text-gray-400"}`}>
                    {role.is_active ? "啟用" : "停用"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {!role.is_system && (
                    <button onClick={() => handleToggle(role.access_role_id, role.is_active)} className="text-xs text-gray-400 hover:text-white">
                      {role.is_active ? "停用" : "啟用"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 權限一覽 */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">系統權限一覽</h2>
        <div className="space-y-4">
          {Object.entries(permsByCategory).map(([category, perms]) => (
            <div key={category} className="card p-4">
              <h3 className="mb-2 text-sm font-medium text-primary-400">{category}</h3>
              <div className="grid grid-cols-2 gap-2">
                {perms.map((p) => (
                  <div key={p.permission_id} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-gray-500">{p.permission_key}</span>
                    <span className="text-gray-300">{p.permission_name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
