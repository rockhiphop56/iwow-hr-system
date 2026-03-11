"use client";

import { useState } from "react";
import type { Tenant } from "@/types/database.types";
import { updateTenantAction } from "@/app/actions/tenant.actions";

interface Props {
  tenants: Tenant[];
}

export function TenantSettings({ tenants }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Tenant>>({});
  const [loading, setLoading] = useState(false);

  function startEdit(tenant: Tenant) {
    setEditing(tenant.tenant_id);
    setForm({
      tenant_name: tenant.tenant_name,
      short_name: tenant.short_name ?? "",
      address: tenant.address ?? "",
      phone: tenant.phone ?? "",
      tax_id: tenant.tax_id ?? "",
    });
  }

  async function handleSave(tenantId: string) {
    setLoading(true);
    const result = await updateTenantAction(tenantId, {
      tenant_name: form.tenant_name,
      short_name: form.short_name || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      tax_id: form.tax_id || undefined,
    });
    if (result.success) {
      setEditing(null);
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {tenants.map((tenant) => (
        <div key={tenant.tenant_id} className="card p-4">
          {editing === tenant.tenant_id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">公司全名</label>
                  <input className="input-field w-full" value={form.tenant_name ?? ""} onChange={(e) => setForm({ ...form, tenant_name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">簡稱</label>
                  <input className="input-field w-full" value={form.short_name ?? ""} onChange={(e) => setForm({ ...form, short_name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">地址</label>
                  <input className="input-field w-full" value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">電話</label>
                  <input className="input-field w-full" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">統一編號</label>
                  <input className="input-field w-full" value={form.tax_id ?? ""} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleSave(tenant.tenant_id)} disabled={loading} className="btn-primary text-sm">儲存</button>
                <button onClick={() => setEditing(null)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">取消</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{tenant.tenant_name}</h3>
                  {tenant.short_name && (
                    <span className="rounded-full bg-primary-400/10 px-2 py-0.5 text-xs text-primary-400">{tenant.short_name}</span>
                  )}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400">{tenant.tenant_type}</span>
                </div>
                <div className="mt-1 flex gap-4 text-sm text-gray-400">
                  {tenant.address && <span>{tenant.address}</span>}
                  {tenant.phone && <span>{tenant.phone}</span>}
                  {tenant.tax_id && <span>統編：{tenant.tax_id}</span>}
                </div>
              </div>
              <button onClick={() => startEdit(tenant)} className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-gray-400 hover:text-white">
                編輯
              </button>
            </div>
          )}
        </div>
      ))}
      {tenants.length === 0 && (
        <div className="card p-12 text-center text-gray-400">尚無公司資料</div>
      )}
    </div>
  );
}
