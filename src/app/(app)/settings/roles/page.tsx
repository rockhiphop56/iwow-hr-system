import { getAccessRoles, getAllPermissions } from "@/services/access-roles.service";
import { RoleManagement } from "@/components/settings/RoleManagement";

export default async function RolesPage() {
  let roles: Awaited<ReturnType<typeof getAccessRoles>> = [];
  let permissions: Awaited<ReturnType<typeof getAllPermissions>> = [];

  try {
    [roles, permissions] = await Promise.all([getAccessRoles(), getAllPermissions()]);
  } catch (err) {
    console.error("Roles fetch failed:", err);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">角色與權限管理</h1>
        <p className="mt-1 text-sm text-gray-400">管理存取角色及其權限配置</p>
      </div>
      <RoleManagement roles={roles} permissions={permissions} />
    </div>
  );
}
