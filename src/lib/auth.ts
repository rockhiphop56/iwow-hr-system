import { createServerSupabase } from "@/services/supabase/server";

export interface SessionInfo {
  userId: string;
  tenantId: string;
  email: string;
}

/**
 * 取得當前 Session 資訊，包含 tenant_id
 * tenant_id 來自 Supabase user.app_metadata.tenant_id
 */
export async function getSession(): Promise<SessionInfo | null> {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  const tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) return null;

  return {
    userId: user.id,
    tenantId,
    email: user.email ?? "",
  };
}

/**
 * 強制取得 Session，未登入則拋錯
 */
export async function requireSession(): Promise<SessionInfo> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: No valid session");
  }
  return session;
}
