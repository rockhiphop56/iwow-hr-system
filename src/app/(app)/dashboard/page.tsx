import { StatsCards } from "@/components/dashboard/StatsCards";
import { EmployeeTable } from "@/components/dashboard/EmployeeTable";
import { DepartmentTree } from "@/components/dashboard/DepartmentTree";
import {
  getDashboardStats,
  getEmployeesWithAssignments,
  getExpiryAlerts,
} from "@/services/employees.service";
import { getDepartments, buildDeptTree } from "@/services/departments.service";
import type { ExpiryAlert } from "@/types/database.types";

const ALERT_TYPE_LABELS: Record<string, string> = {
  contract: "承攬到期",
  rental_housing_cert: "租賃住宅管理人員證書到期",
  real_estate_agent: "不動產營業員證書到期",
  real_estate_broker: "不動產經紀人證書到期",
};

export default async function DashboardPage() {
  let stats = {
    totalEmployees: 0,
    totalDepartments: 0,
    totalMentorships: 0,
    activeAssignments: 0,
  };
  let employees: Awaited<ReturnType<typeof getEmployeesWithAssignments>> = [];
  let deptTree: ReturnType<typeof buildDeptTree> = [];
  let alerts: ExpiryAlert[] = [];

  try {
    const [s, e, d, a] = await Promise.all([
      getDashboardStats(),
      getEmployeesWithAssignments(),
      getDepartments(),
      getExpiryAlerts(),
    ]);
    stats = s;
    employees = e;
    deptTree = buildDeptTree(d);
    alerts = a;
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

      {/* 到期提醒 */}
      {alerts.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-amber-400">即將到期提醒</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert, i) => (
              <div
                key={`${alert.user_uuid}-${alert.type}-${i}`}
                className="card flex items-center gap-3 border border-amber-500/20 bg-amber-500/5 p-4"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  alert.days_remaining <= 7 ? "bg-red-500 text-white" : "bg-amber-500 text-black"
                }`}>
                  {alert.days_remaining}
                </div>
                <div>
                  <p className="font-medium">{alert.name}</p>
                  <p className="text-xs text-amber-400/70">
                    {ALERT_TYPE_LABELS[alert.type] ?? alert.type} · {alert.expiry_date}
                  </p>
                  <p className="text-xs text-gray-500">
                    剩餘 {alert.days_remaining} 天
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
