import { createServerSupabase } from "@/services/supabase/server";
import type { MentorTreeNode } from "@/types/database.types";

/**
 * 建構師徒樹（只到 L2 — 徒孫）
 * 查詢 mentorships 表 generation_level=1 的直接關係
 * 找出所有「師父」（有徒弟的人），然後遞迴一層找徒孫
 */
export async function buildMentorTree(): Promise<MentorTreeNode[]> {
  const supabase = await createServerSupabase();

  // 取得所有活躍的師徒關係（generation_level=1 的直接關係）
  const { data: mentorships, error } = await supabase
    .from("mentorships")
    .select(`
      mentor_uuid,
      apprentice_uuid,
      mentor:employees!mentor_uuid(user_uuid, name, avatar_url),
      apprentice:employees!apprentice_uuid(user_uuid, name, avatar_url)
    `)
    .eq("status", "active")
    .eq("generation_level", 1);

  if (error) throw new Error(error.message);
  if (!mentorships || mentorships.length === 0) return [];

  // 取得所有涉及的員工的任職資訊（部門+職務）
  const allUuids = new Set<string>();
  mentorships.forEach((m: any) => {
    allUuids.add(m.mentor_uuid);
    allUuids.add(m.apprentice_uuid);
  });

  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      user_uuid,
      department:departments!dept_id(dept_name),
      role:job_roles!role_id(role_name)
    `)
    .in("user_uuid", Array.from(allUuids))
    .eq("status", "active");

  // 建立員工附加資訊 map
  const infoMap = new Map<string, { role_name: string | null; dept_name: string | null }>();
  (assignments ?? []).forEach((a: any) => {
    infoMap.set(a.user_uuid, {
      role_name: a.role?.role_name ?? null,
      dept_name: a.department?.dept_name ?? null,
    });
  });

  // 建立 mentor → apprentices 映射
  const mentorToApprentices = new Map<string, Set<string>>();
  const allApprentices = new Set<string>();

  mentorships.forEach((m: any) => {
    if (!mentorToApprentices.has(m.mentor_uuid)) {
      mentorToApprentices.set(m.mentor_uuid, new Set());
    }
    mentorToApprentices.get(m.mentor_uuid)!.add(m.apprentice_uuid);
    allApprentices.add(m.apprentice_uuid);
  });

  // 員工資料 map
  const empMap = new Map<string, { user_uuid: string; name: string; avatar_url: string | null }>();
  mentorships.forEach((m: any) => {
    if (m.mentor) empMap.set(m.mentor_uuid, m.mentor);
    if (m.apprentice) empMap.set(m.apprentice_uuid, m.apprentice);
  });

  // 找出頂層師父（沒有被其他人指導的）
  const topMentors = new Set<string>();
  mentorToApprentices.forEach((_, mentorUuid) => {
    if (!allApprentices.has(mentorUuid)) {
      topMentors.add(mentorUuid);
    }
  });

  // 建構樹（限 L2）
  function buildNode(uuid: string, depth: number): MentorTreeNode {
    const emp = empMap.get(uuid);
    const info = infoMap.get(uuid);

    const node: MentorTreeNode = {
      user_uuid: uuid,
      name: emp?.name ?? "未知",
      avatar_url: emp?.avatar_url ?? null,
      role_name: info?.role_name ?? null,
      dept_name: info?.dept_name ?? null,
      apprentices: [],
    };

    // 只到 L2（depth 0=師父, 1=徒弟, 2=徒孫 → 不再往下）
    if (depth < 2) {
      const children = mentorToApprentices.get(uuid);
      if (children) {
        node.apprentices = Array.from(children).map((childUuid) =>
          buildNode(childUuid, depth + 1)
        );
      }
    }

    return node;
  }

  return Array.from(topMentors).map((uuid) => buildNode(uuid, 0));
}
