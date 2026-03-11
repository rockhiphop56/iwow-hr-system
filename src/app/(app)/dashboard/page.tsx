import { StatsCards } from "@/components/dashboard/StatsCards";
import { EmployeeTable } from "@/components/dashboard/EmployeeTable";
import { DepartmentTree } from "@/components/dashboard/DepartmentTree";
import {
  getDashboardStats,
  getEmployeesWithAssignments,
} from "@/services/employees.service";
import { getDepartments, buildDeptTree } from "@/services/departments.service";

export default async function DashboardPage() {
  let stats = {
    totalEmployees: 0,
    totalDepartments: 0,
    totalMentorships: 0,
    activeAssignments: 0,
  };
  let employees: Awaited<ReturnType<typeof getEmployeesWithAssignments>> = [];
  let deptTree: ReturnType<typeof buildDeptTree> = [];

  try {
    const [s, e, d] = await Promise.all([
      getDashboardStats(),
      getEmployeesWithAssignments(),
      getDepartments(),
    ]);
    stats = s;
    employees = e;
    deptTree = buildDeptTree(d);
  } catch (err) {
    console.error("Dashboard data fetch failed:", err);
  }

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
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">員工列表</h2>
          <EmployeeTable employees={employees} />
        </div>
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
