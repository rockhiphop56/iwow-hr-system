import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { getDepartments, getJobRoles } from "@/services/departments.service";
import { getEmployeeOptions } from "@/services/employees.service";

export default async function NewEmployeePage() {
  const [departments, roles, employees] = await Promise.all([
    getDepartments(),
    getJobRoles(),
    getEmployeeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">新增員工</h1>
        <p className="mt-1 text-sm text-gray-400">
          建立員工資料、指派行政組織與師徒關係
        </p>
      </div>
      <EmployeeForm
        departments={departments}
        roles={roles}
        employees={employees}
      />
    </div>
  );
}
