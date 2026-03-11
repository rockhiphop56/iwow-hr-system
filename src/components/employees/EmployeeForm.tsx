"use client";

import { useState, useTransition } from "react";
import { createEmployeeAction } from "@/app/actions/employee.actions";
import type { Department, JobRole, Employee } from "@/types/database.types";

interface Props {
  departments: Department[];
  roles: JobRole[];
  employees: Pick<Employee, "user_uuid" | "name">[];
}

export function EmployeeForm({ departments, roles, employees }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createEmployeeAction({
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        phone: (fd.get("phone") as string) || undefined,
        dept_id: fd.get("dept_id") as string,
        role_id: fd.get("role_id") as string,
        manager_uuid: (fd.get("manager_uuid") as string) || undefined,
        mentor_uuid: (fd.get("mentor_uuid") as string) || undefined,
      });
      setResult(res);
      if (res.success) {
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl space-y-6">
      {/* 基本資訊 */}
      <Section title="基本資訊">
        <Field label="姓名" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="電話" name="phone" />
      </Section>

      {/* 行政指派 */}
      <Section title="行政指派">
        <SelectField label="部門" name="dept_id" required options={
          departments.map((d) => ({ value: d.dept_id, label: d.dept_name }))
        } />
        <SelectField label="職務" name="role_id" required options={
          roles.map((r) => ({ value: r.role_id, label: `${r.role_name} (Lv.${r.job_level})` }))
        } />
        <SelectField label="設定行政主管" name="manager_uuid" options={
          employees.map((e) => ({ value: e.user_uuid, label: e.name }))
        } />
      </Section>

      {/* 師徒制 */}
      <Section title="師徒制指派">
        <SelectField label="設定利益導師" name="mentor_uuid" options={
          employees.map((e) => ({ value: e.user_uuid, label: e.name }))
        } />
      </Section>

      {/* Result */}
      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          result.success ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
        }`}>
          {result.success ? "員工新增成功！" : `錯誤：${result.error}`}
        </div>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "處理中..." : "新增員工並指派"}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, name, type = "text", required = false }: {
  label: string; name: string; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-300">{label}{required && <span className="text-red-400"> *</span>}</span>
      <input name={name} type={type} required={required} className="input-field" placeholder={label} />
    </label>
  );
}

function SelectField({ label, name, options, required = false }: {
  label: string; name: string; required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-300">{label}{required && <span className="text-red-400"> *</span>}</span>
      <select name={name} required={required} className="select-field">
        <option value="">-- 請選擇 --</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
