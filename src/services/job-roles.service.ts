import { createServerSupabase } from "@/services/supabase/server";
import type { JobRole } from "@/types/database.types";

/** 取得當前租戶所有職務（含停用） */
export async function getAllJobRoles(): Promise<JobRole[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("job_roles")
    .select("*")
    .order("job_level");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 新增職務 */
export async function createJobRole(
  payload: Pick<JobRole, "tenant_id" | "role_name" | "job_level"> & Partial<Pick<JobRole, "description">>
): Promise<JobRole> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("job_roles")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 更新職務 */
export async function updateJobRole(
  roleId: string,
  payload: Partial<Pick<JobRole, "role_name" | "job_level" | "description" | "is_active">>
): Promise<JobRole> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("job_roles")
    .update(payload)
    .eq("role_id", roleId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 刪除職務 */
export async function deleteJobRole(roleId: string): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("job_roles")
    .delete()
    .eq("role_id", roleId);

  if (error) throw new Error(error.message);
}
