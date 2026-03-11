"use client";

import { useState, useTransition } from "react";
import { createEmployeeAction } from "@/app/actions/employee.actions";
import type { Department, JobRole, Employee, EmploymentType, JobGrade, Gender } from "@/types/database.types";

interface Props {
  departments: Department[];
  roles: JobRole[];
  employees: Pick<Employee, "user_uuid" | "name">[];
  employmentTypes: EmploymentType[];
  jobGrades: JobGrade[];
}

export function EmployeeForm({ departments, roles, employees, employmentTypes, jobGrades }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [selectedEmpType, setSelectedEmpType] = useState<string>("");

  // 判斷目前選的僱用類型是否為承攬
  const isContractor = employmentTypes.find((t) => t.employment_type_id === selectedEmpType)?.is_contractor ?? false;

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
        // 新欄位
        employee_no: (fd.get("employee_no") as string) || undefined,
        gender: (fd.get("gender") as Gender) || undefined,
        date_of_birth: (fd.get("date_of_birth") as string) || undefined,
        address: (fd.get("address") as string) || undefined,
        emergency_contact_name: (fd.get("emergency_contact_name") as string) || undefined,
        emergency_contact_phone: (fd.get("emergency_contact_phone") as string) || undefined,
        hire_date: (fd.get("hire_date") as string) || undefined,
        contract_start_date: (fd.get("contract_start_date") as string) || undefined,
        contract_end_date: (fd.get("contract_end_date") as string) || undefined,
        rental_housing_cert_no: (fd.get("rental_housing_cert_no") as string) || undefined,
        rental_housing_cert_expiry: (fd.get("rental_housing_cert_expiry") as string) || undefined,
        real_estate_agent_no: (fd.get("real_estate_agent_no") as string) || undefined,
        real_estate_agent_expiry: (fd.get("real_estate_agent_expiry") as string) || undefined,
        real_estate_broker_no: (fd.get("real_estate_broker_no") as string) || undefined,
        real_estate_broker_expiry: (fd.get("real_estate_broker_expiry") as string) || undefined,
        employment_type_id: (fd.get("employment_type_id") as string) || undefined,
        grade_id: (fd.get("grade_id") as string) || undefined,
        is_dept_head: fd.get("is_dept_head") === "on",
      });
      setResult(res);
      if (res.success) {
        (e.target as HTMLFormElement).reset();
        setSelectedEmpType("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-3xl space-y-6">
      {/* 基本資訊 */}
      <Section title="基本資訊">
        <Field label="員工編號" name="employee_no" />
        <Field label="姓名" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="電話" name="phone" />
        <SelectField label="性別" name="gender" options={[
          { value: "male", label: "男" },
          { value: "female", label: "女" },
          { value: "other", label: "其他" },
        ]} />
        <Field label="出生日期" name="date_of_birth" type="date" />
        <div className="sm:col-span-2">
          <Field label="居住地址" name="address" />
        </div>
      </Section>

      {/* 緊急聯絡人 */}
      <Section title="緊急聯絡人">
        <Field label="緊急聯絡人姓名" name="emergency_contact_name" />
        <Field label="緊急聯絡人電話" name="emergency_contact_phone" />
      </Section>

      {/* 行政指派 */}
      <Section title="行政指派">
        <SelectField label="部門" name="dept_id" required options={
          departments.map((d) => ({ value: d.dept_id, label: d.dept_name }))
        } />
        <SelectField label="職務" name="role_id" required options={
          roles.map((r) => ({ value: r.role_id, label: `${r.role_name} (Lv.${r.job_level})` }))
        } />
        <SelectField label="僱用類型" name="employment_type_id" options={
          employmentTypes.filter((t) => t.is_active).map((t) => ({
            value: t.employment_type_id,
            label: `${t.type_name}${t.is_contractor ? " (承攬)" : ""}`,
          }))
        } onChange={setSelectedEmpType} />
        <SelectField label="職等" name="grade_id" options={
          jobGrades.filter((g) => g.is_active).map((g) => ({ value: g.grade_id, label: `${g.grade_name} (${g.grade_code})` }))
        } />
        <SelectField label="行政主管" name="manager_uuid" options={
          employees.map((e) => ({ value: e.user_uuid, label: e.name }))
        } />
        <div className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" name="is_dept_head" id="is_dept_head" className="rounded border-gray-600" />
          <label htmlFor="is_dept_head" className="text-sm text-gray-300">設為部門主管</label>
        </div>
      </Section>

      {/* 工作日期 — 根據僱用類型動態切換 */}
      <Section title={isContractor ? "承攬期間" : "到職資訊"}>
        {isContractor ? (
          <>
            <Field label="承攬開始日" name="contract_start_date" type="date" />
            <Field label="承攬結束日" name="contract_end_date" type="date" />
          </>
        ) : (
          <Field label="到職日期" name="hire_date" type="date" />
        )}
      </Section>

      {/* 師徒制 */}
      <Section title="師徒制指派">
        <SelectField label="設定利益導師" name="mentor_uuid" options={
          employees.map((e) => ({ value: e.user_uuid, label: e.name }))
        } />
      </Section>

      {/* 產業證照 */}
      <Section title="產業證照（包租代管）">
        <Field label="租賃住宅管理人員證書字號" name="rental_housing_cert_no" />
        <Field label="證書到期日" name="rental_housing_cert_expiry" type="date" />
        <Field label="不動產營業員字號" name="real_estate_agent_no" />
        <Field label="證書到期日" name="real_estate_agent_expiry" type="date" />
        <Field label="不動產經紀人字號" name="real_estate_broker_no" />
        <Field label="證書到期日" name="real_estate_broker_expiry" type="date" />
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

function SelectField({ label, name, options, required = false, onChange }: {
  label: string; name: string; required?: boolean;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-300">{label}{required && <span className="text-red-400"> *</span>}</span>
      <select
        name={name}
        required={required}
        className="select-field"
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      >
        <option value="">-- 請選擇 --</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
