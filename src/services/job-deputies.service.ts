import { createServerSupabase } from "@/services/supabase/server";
import type { JobDeputy } from "@/types/database.types";

/** 取得當前租戶所有代理人設定 */
export async function getJobDeputies(): Promise<JobDeputy[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("job_deputies")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 取得活躍的代理關係（今天在有效期間內） */
export async function getActiveDeputies(): Promise<JobDeputy[]> {
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("job_deputies")
    .select("*")
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 取得某用戶的代理人（我被誰代理） */
export async function getDeputiesForUser(userUuid: string): Promise<JobDeputy[]> {
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("job_deputies")
    .select("*")
    .eq("original_user_uuid", userUuid)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 新增代理人設定 */
export async function createJobDeputy(
  payload: Pick<JobDeputy, "tenant_id" | "original_user_uuid" | "deputy_user_uuid" | "start_date" | "end_date"> & Partial<Pick<JobDeputy, "reason">>
): Promise<JobDeputy> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("job_deputies")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 更新代理人設定 */
export async function updateJobDeputy(
  id: string,
  payload: Partial<Pick<JobDeputy, "start_date" | "end_date" | "reason" | "is_active">>
): Promise<JobDeputy> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("job_deputies")
    .update(payload)
    .eq("job_deputy_id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 刪除代理人設定 */
export async function deleteJobDeputy(id: string): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("job_deputies")
    .delete()
    .eq("job_deputy_id", id);

  if (error) throw new Error(error.message);
}
