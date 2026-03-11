import { StatsCards } from "@/components/dashboard/StatsCards";
import { EmployeeTable } from "@/components/dashboard/EmployeeTable";
import { DepartmentTree } from "@/components/dashboard/DepartmentTree";
import { getDashboardStats, getEmployeesWithAssignments } from "@/services/employees.service";
import { getDepartments } from "@/services/departments.service";
import { buildDeptTree } from "@/services/departments.service";

export default async function DashboardPage() {
  const [stats, employees, departments] = await Promise.all([
    getDashboardStats(),
    getEmployeesWithAssignments(),
    getDepartments(),
  ]);

  const deptTree = buildDeptTree(departments);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">儀表板</h1>
        <p className="mt-1 text-sm text-gray-400">
          愛窩集團人事管理系統總覽
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Employee Table */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">員工列表</h2>
          <EmployeeTable employees={employees} />
        </div>

        {/* Department Tree */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">組織架構</h2>
          <div className="card">
            <DepartmentTree tree={deptTree} />
          </div>
        </div>
      </div>
    </div>
  );
}
