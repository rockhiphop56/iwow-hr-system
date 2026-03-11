import { createServerSupabase } from "@/services/supabase/server";
import type { JobGrade } from "@/types/database.types";

/** 取得當前租戶所有職等 */
export async function getJobGrades(): Promise<JobGrade[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("job_grades")
    .select("*")
    .order("grade_rank");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 取得啟用中的職等 */
export async function getActiveJobGrades(): Promise<JobGrade[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("job_grades")
    .select("*")
    .eq("is_active", true)
    .order("grade_rank");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 新增職等 */
export async function createJobGrade(
  payload: Pick<JobGrade, "tenant_id" | "grade_name" | "grade_code" | "grade_rank"> & Partial<Pick<JobGrade, "description">>
): Promise<JobGrade> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("job_grades")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 更新職等 */
export async function updateJobGrade(
  id: string,
  payload: Partial<Pick<JobGrade, "grade_name" | "grade_code" | "grade_rank" | "description" | "is_active">>
): Promise<JobGrade> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("job_grades")
    .update(payload)
    .eq("grade_id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 刪除職等 */
export async function deleteJobGrade(id: string): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("job_grades")
    .delete()
    .eq("grade_id", id);

  if (error) throw new Error(error.message);
}
