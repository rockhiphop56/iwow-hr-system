import { createServerSupabase } from "@/services/supabase/server";
import type { AccessRole, Permission, UserAccessRole } from "@/types/database.types";

/** 取得當前租戶所有存取角色 */
export async function getAccessRoles(): Promise<AccessRole[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("access_roles")
    .select("*")
    .order("role_name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 取得所有權限定義 */
export async function getAllPermissions(): Promise<Permission[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("permissions")
    .select("*")
    .order("category, permission_key");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 取得某角色的權限列表 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("access_role_permissions")
    .select("permission:permissions!permission_id(permission_key)")
    .eq("access_role_id", roleId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => r.permission?.permission_key).filter(Boolean);
}

/** 新增存取角色 */
export async function createAccessRole(
  payload: Pick<AccessRole, "tenant_id" | "role_name" | "role_code" | "data_scope"> & Partial<Pick<AccessRole, "description">>
): Promise<AccessRole> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("access_roles")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 更新存取角色 */
export async function updateAccessRole(
  id: string,
  payload: Partial<Pick<AccessRole, "role_name" | "role_code" | "data_scope" | "description" | "is_active">>
): Promise<AccessRole> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("access_roles")
    .update(payload)
    .eq("access_role_id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 設定角色權限（先刪後加） */
export async function setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  const supabase = await createServerSupabase();

  // 先清除舊的
  const { error: delError } = await supabase
    .from("access_role_permissions")
    .delete()
    .eq("access_role_id", roleId);

  if (delError) throw new Error(delError.message);

  // 再新增
  if (permissionIds.length > 0) {
    const rows = permissionIds.map((pid) => ({
      access_role_id: roleId,
      permission_id: pid,
    }));

    const { error: insError } = await supabase
      .from("access_role_permissions")
      .insert(rows);

    if (insError) throw new Error(insError.message);
  }
}

/** 指派角色給用戶 */
export async function assignRoleToUser(
  userUuid: string,
  roleId: string,
  tenantId: string
): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("user_access_roles")
    .insert({ user_uuid: userUuid, access_role_id: roleId, tenant_id: tenantId });

  if (error) throw new Error(error.message);
}

/** 移除用戶角色 */
export async function removeRoleFromUser(
  userUuid: string,
  roleId: string,
  tenantId: string
): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("user_access_roles")
    .delete()
    .eq("user_uuid", userUuid)
    .eq("access_role_id", roleId)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
}

/** 取得用戶的角色列表 */
export async function getUserRoles(userUuid: string, tenantId: string): Promise<UserAccessRole[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("user_access_roles")
    .select("*")
    .eq("user_uuid", userUuid)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
  return data ?? [];
}
