import { createServerSupabase } from "@/services/supabase/server";
import { requireSession } from "@/lib/auth";
import type { DataScope, UserPermissions } from "@/types/database.types";

/**
 * 取得用戶完整權限（含代理人合併）
 * 1. 查詢 user_access_roles → access_roles → access_role_permissions → permissions
 * 2. 查詢 job_deputies 找出正在代理的用戶
 * 3. 合併被代理人的權限
 */
export async function getUserPermissions(): Promise<UserPermissions> {
  const session = await requireSession();
  const supabase = await createServerSupabase();

  // 1. 取得用戶自身角色與權限
  const { data: userRoles } = await supabase
    .from("user_access_roles")
    .select(`
      access_role_id,
      access_role:access_roles!access_role_id(
        access_role_id, role_code, data_scope, is_active,
        permissions:access_role_permissions(
          permission:permissions!permission_id(permission_key)
        )
      )
    `)
    .eq("user_uuid", session.userId)
    .eq("tenant_id", session.tenantId);

  // 2. 查詢活躍的代理關係（我作為代理人）
  const today = new Date().toISOString().split("T")[0];
  const { data: deputyRecords } = await supabase
    .from("job_deputies")
    .select("original_user_uuid")
    .eq("deputy_user_uuid", session.userId)
    .eq("tenant_id", session.tenantId)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today);

  const deputyFor = (deputyRecords ?? []).map((d: any) => d.original_user_uuid);

  // 3. 如果有代理人，取得被代理人的權限
  let deputyPermissions: string[] = [];
  if (deputyFor.length > 0) {
    const { data: deputyRoles } = await supabase
      .from("user_access_roles")
      .select(`
        access_role:access_roles!access_role_id(
          permissions:access_role_permissions(
            permission:permissions!permission_id(permission_key)
          )
        )
      `)
      .in("user_uuid", deputyFor)
      .eq("tenant_id", session.tenantId);

    deputyPermissions = extractPermissionKeys(deputyRoles ?? []);
  }

  // 4. 合併權限
  const ownPermissions = extractPermissionKeys(userRoles ?? []);
  const allPermissions = [...new Set([...ownPermissions, ...deputyPermissions])];

  // 5. 取得最高 data_scope
  const scopes = (userRoles ?? [])
    .map((r: any) => r.access_role?.data_scope)
    .filter(Boolean) as DataScope[];

  // 如果有代理，也可能提升 scope
  // 代理人在代理期間等同被代理人
  const dataScope = resolveHighestScope(scopes);

  const roleIds = (userRoles ?? [])
    .map((r: any) => r.access_role_id)
    .filter(Boolean);

  return {
    permissions: allPermissions,
    dataScope,
    roleIds,
    deputyFor,
  };
}

/**
 * 檢查用戶是否有特定權限
 */
export async function checkPermission(permissionKey: string): Promise<boolean> {
  const { permissions } = await getUserPermissions();
  return permissions.includes(permissionKey);
}

/**
 * 要求特定權限，無權限則拋錯
 */
export async function requirePermission(permissionKey: string): Promise<void> {
  const hasPermission = await checkPermission(permissionKey);
  if (!hasPermission) {
    throw new Error(`權限不足：需要 ${permissionKey}`);
  }
}

/**
 * 取得用戶的資料範圍
 */
export async function getDataScope(): Promise<DataScope> {
  const { dataScope } = await getUserPermissions();
  return dataScope;
}

// --- Helper ---

function extractPermissionKeys(roles: any[]): string[] {
  const keys: string[] = [];
  for (const r of roles) {
    const perms = r.access_role?.permissions ?? r.permissions ?? [];
    for (const p of perms) {
      const key = p.permission?.permission_key ?? p.permission_key;
      if (key) keys.push(key);
    }
  }
  return keys;
}

const SCOPE_PRIORITY: DataScope[] = ["all", "department", "mentorship", "self"];

function resolveHighestScope(scopes: DataScope[]): DataScope {
  for (const s of SCOPE_PRIORITY) {
    if (scopes.includes(s)) return s;
  }
  return "self";
}
