import { createServerSupabase } from "@/services/supabase/server";
import type { Assignment } from "@/types/database.types";

/** 建立行政任職 */
export async function createAssignment(
  payload: Pick<Assignment, "user_uuid" | "tenant_id" | "dept_id" | "role_id" | "manager_uuid">
): Promise<Assignment> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("assignments")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
