import { getAllJobRoles } from "@/services/job-roles.service";
import { JobRoleSettings } from "@/components/settings/JobRoleSettings";

export default async function JobRolesPage() {
  let roles: Awaited<ReturnType<typeof getAllJobRoles>> = [];

  try {
    roles = await getAllJobRoles();
  } catch (err) {
    console.error("JobRoles fetch failed:", err);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">職務管理</h1>
        <p className="mt-1 text-sm text-gray-400">管理組織內的職務定義與職等級別</p>
      </div>
      <JobRoleSettings roles={roles} />
    </div>
  );
}
