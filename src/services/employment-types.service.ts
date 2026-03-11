import { createServerSupabase } from "@/services/supabase/server";
import type { EmploymentType } from "@/types/database.types";

/** 取得當前租戶所有僱用類型 */
export async function getEmploymentTypes(): Promise<EmploymentType[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("employment_types")
    .select("*")
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 取得啟用中的僱用類型 */
export async function getActiveEmploymentTypes(): Promise<EmploymentType[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("employment_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 新增僱用類型 */
export async function createEmploymentType(
  payload: Pick<EmploymentType, "tenant_id" | "type_name" | "type_code" | "is_contractor"> & Partial<Pick<EmploymentType, "description" | "sort_order">>
): Promise<EmploymentType> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("employment_types")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 更新僱用類型 */
export async function updateEmploymentType(
  id: string,
  payload: Partial<Pick<EmploymentType, "type_name" | "type_code" | "is_contractor" | "description" | "sort_order" | "is_active">>
): Promise<EmploymentType> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("employment_types")
    .update(payload)
    .eq("employment_type_id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 刪除僱用類型 */
export async function deleteEmploymentType(id: string): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("employment_types")
    .delete()
    .eq("employment_type_id", id);

  if (error) throw new Error(error.message);
}
