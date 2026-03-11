import { createServerSupabase } from "@/services/supabase/server";
import type { Assignment } from "@/types/database.types";

/** 建立行政任職 */
export async function createAssignment(
  payload: Pick<Assignment, "user_uuid" | "tenant_id" | "dept_id" | "role_id" | "manager_uuid"> &
    Partial<Pick<Assignment, "employment_type_id" | "grade_id" | "is_dept_head">>
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

/** 更新任職 */
export async function updateAssignment(
  assignmentId: string,
  payload: Partial<Pick<Assignment, "dept_id" | "role_id" | "manager_uuid" | "employment_type_id" | "grade_id" | "is_dept_head" | "status" | "end_date">>
): Promise<Assignment> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("assignments")
    .update(payload)
    .eq("assignment_id", assignmentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
