"use server";

import { createServerSupabase } from "@/services/supabase/server";
import { requireSession } from "@/lib/auth";

export interface OnboardingResult {
  success: boolean;
  error?: string;
}

// 預設部門與職務 UUID（對應 migration 00003）
const DEFAULT_DEPT_ID = "d0d0d0d0-0001-4000-a000-000000000001";
const DEFAULT_ROLE_ID = "a0a0a0a0-0001-4000-b000-000000000001";

export async function completeProfileAction(input: {
  name: string;
  phone?: string;
}): Promise<OnboardingResult> {
  try {
    const session = await requireSession();
    const supabase = await createServerSupabase();

    // 1. 建立員工記錄（用 auth user ID 作為 user_uuid）
    const { error: empError } = await supabase.from("employees").insert({
      user_uuid: session.userId,
      name: input.name,
      email: session.email,
      phone: input.phone || null,
    });

    if (empError) {
      // 若已存在（重複 email 或 UUID），跳過
      if (!empError.message.includes("duplicate")) {
        throw new Error(empError.message);
      }
    }

    // 2. 建立預設行政任職
    const { error: assignError } = await supabase
      .from("assignments")
      .insert({
        user_uuid: session.userId,
        tenant_id: session.tenantId,
        dept_id: DEFAULT_DEPT_ID,
        role_id: DEFAULT_ROLE_ID,
      });

    if (assignError) {
      if (!assignError.message.includes("duplicate")) {
        throw new Error(assignError.message);
      }
    }

    // 3. 標記 profile_completed（寫入 user_metadata）
    const { error: updateError } = await supabase.auth.updateUser({
      data: { profile_completed: true },
    });

    if (updateError) throw new Error(updateError.message);

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
