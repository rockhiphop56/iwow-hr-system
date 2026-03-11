import { getJobDeputies } from "@/services/job-deputies.service";
import { getEmployeeOptions } from "@/services/employees.service";
import { JobDeputySettings } from "@/components/settings/JobDeputySettings";

export default async function JobDeputiesPage() {
  let deputies: Awaited<ReturnType<typeof getJobDeputies>> = [];
  let employees: Awaited<ReturnType<typeof getEmployeeOptions>> = [];

  try {
    [deputies, employees] = await Promise.all([getJobDeputies(), getEmployeeOptions()]);
  } catch (err) {
    console.error("JobDeputies fetch failed:", err);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">職務代理人管理</h1>
        <p className="mt-1 text-sm text-gray-400">設定職務代理人，代理期間內代理人擁有被代理人所有權限</p>
      </div>
      <JobDeputySettings deputies={deputies} employees={employees} />
    </div>
  );
}
