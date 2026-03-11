import { createServerSupabase } from "@/services/supabase/server";
import type { Mentorship } from "@/types/database.types";

/** 取得當前租戶所有師徒關係 */
export async function getMentorships(): Promise<Mentorship[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("mentorships")
    .select("*")
    .order("generation_level");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 取得特定員工的師徒關係（作為導師） */
export async function getMentorshipsByMentor(
  mentorUuid: string
): Promise<Mentorship[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("mentorships")
    .select("*")
    .eq("mentor_uuid", mentorUuid)
    .eq("status", "active");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 建立師徒關係 */
export async function createMentorship(
  payload: Pick<Mentorship, "tenant_id" | "mentor_uuid" | "apprentice_uuid" | "generation_level">
): Promise<Mentorship> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("mentorships")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
