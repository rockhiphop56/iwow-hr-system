import type { EmployeeWithAssignment } from "@/types/database.types";

interface Props {
  employees: EmployeeWithAssignment[];
}

export function EmployeeTable({ employees }: Props) {
  if (employees.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-12 text-gray-500">
        <svg className="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        <p>尚無員工資料</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-gray-400">
            <th className="px-6 py-4">姓名</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">部門</th>
            <th className="px-6 py-4">職務</th>
            <th className="px-6 py-4">行政主管</th>
            <th className="px-6 py-4">狀態</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {employees.map((emp) => (
            <tr key={emp.user_uuid} className="transition-colors hover:bg-white/5">
              <td className="px-6 py-4 font-medium">{emp.name}</td>
              <td className="px-6 py-4 text-gray-400">{emp.email}</td>
              <td className="px-6 py-4">{emp.department?.dept_name ?? "-"}</td>
              <td className="px-6 py-4">{emp.role?.role_name ?? "-"}</td>
              <td className="px-6 py-4">{emp.manager?.name ?? "-"}</td>
              <td className="px-6 py-4">
                <StatusBadge status={emp.assignment?.status ?? "inactive"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    inactive: "bg-gray-500/20 text-gray-400",
    suspended: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? colors.inactive}`}>
      {status}
    </span>
  );
}
