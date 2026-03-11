import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { getDepartments, getJobRoles } from "@/services/departments.service";
import { getEmployeeOptions } from "@/services/employees.service";
import type { Department, JobRole, Employee } from "@/types/database.types";

export default async function NewEmployeePage() {
  let departments: Department[] = [];
  let roles: JobRole[] = [];
  let employees: Pick<Employee, "user_uuid" | "name">[] = [];
  let loadError = "";

  try {
    const [d, r, e] = await Promise.all([
      getDepartments(),
      getJobRoles(),
      getEmployeeOptions(),
    ]);
    departments = d;
    roles = r;
    employees = e;
  } catch (err) {
    console.error("NewEmployeePage data fetch failed:", err);
    loadError =
      err instanceof Error ? err.message : "無法載入資料，請稍後再試";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">新增員工</h1>
        <p className="mt-1 text-sm text-gray-400">
          建立員工資料、指派行政組織與師徒關係
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
          ⚠️ {loadError}
        </div>
      )}

      <EmployeeForm
        departments={departments}
        roles={roles}
        employees={employees}
      />
    </div>
  );
}
