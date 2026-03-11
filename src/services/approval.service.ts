import { createServerSupabase } from "@/services/supabase/server";
import type {
  ApprovalType,
  ApprovalFlowStep,
  ApprovalRequest,
  ApprovalActionRecord,
  ApprovalRequestWithDetails,
} from "@/types/database.types";

// ============================================================
// 簽核類型 & 流程
// ============================================================

/** 取得所有簽核類型 */
export async function getApprovalTypes(): Promise<ApprovalType[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("approval_types")
    .select("*")
    .order("type_key");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 新增簽核類型 */
export async function createApprovalType(
  payload: Pick<ApprovalType, "tenant_id" | "type_key" | "type_name"> & Partial<Pick<ApprovalType, "description">>
): Promise<ApprovalType> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("approval_types")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 更新簽核類型 */
export async function updateApprovalType(
  id: string,
  payload: Partial<Pick<ApprovalType, "type_name" | "description" | "is_active">>
): Promise<ApprovalType> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("approval_types")
    .update(payload)
    .eq("approval_type_id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 取得某簽核類型的流程步驟 */
export async function getFlowSteps(typeId: string): Promise<ApprovalFlowStep[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("approval_flow_steps")
    .select("*")
    .eq("approval_type_id", typeId)
    .order("step_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 設定流程步驟（先刪後加） */
export async function setFlowSteps(
  typeId: string,
  steps: Pick<ApprovalFlowStep, "step_order" | "approver_type" | "description">[]
): Promise<void> {
  const supabase = await createServerSupabase();

  const { error: delError } = await supabase
    .from("approval_flow_steps")
    .delete()
    .eq("approval_type_id", typeId);

  if (delError) throw new Error(delError.message);

  if (steps.length > 0) {
    const rows = steps.map((s) => ({
      approval_type_id: typeId,
      ...s,
    }));
    const { error: insError } = await supabase
      .from("approval_flow_steps")
      .insert(rows);

    if (insError) throw new Error(insError.message);
  }
}

// ============================================================
// 簽核申請 & 審批
// ============================================================

/** 取得我的簽核申請 */
export async function getMyRequests(userUuid: string): Promise<ApprovalRequestWithDetails[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("approval_requests")
    .select(`
      *,
      type:approval_types!approval_type_id(*),
      requester:employees!requester_uuid(user_uuid, name),
      actions:approval_actions(*)
    `)
    .eq("requester_uuid", userUuid)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ApprovalRequestWithDetails[];
}

/** 取得待我審批的申請 */
export async function getPendingApprovals(tenantId: string): Promise<ApprovalRequestWithDetails[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("approval_requests")
    .select(`
      *,
      type:approval_types!approval_type_id(*),
      requester:employees!requester_uuid(user_uuid, name),
      actions:approval_actions(*)
    `)
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "in_progress"])
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ApprovalRequestWithDetails[];
}

/** 提交簽核申請 */
export async function submitApprovalRequest(
  payload: Pick<ApprovalRequest, "tenant_id" | "approval_type_id" | "requester_uuid" | "payload"> & Partial<Pick<ApprovalRequest, "summary">>
): Promise<ApprovalRequest> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("approval_requests")
    .insert({ ...payload, status: "pending", current_step: 1 })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 審批動作 */
export async function performApprovalAction(
  requestId: string,
  actorUuid: string,
  action: "approve" | "reject" | "return" | "comment",
  comment?: string
): Promise<void> {
  const supabase = await createServerSupabase();

  // 取得目前申請
  const { data: request, error: reqError } = await supabase
    .from("approval_requests")
    .select("*, type:approval_types!approval_type_id(*)")
    .eq("request_id", requestId)
    .single();

  if (reqError) throw new Error(reqError.message);

  // 記錄操作
  const { error: actError } = await supabase
    .from("approval_actions")
    .insert({
      request_id: requestId,
      step_order: request.current_step,
      actor_uuid: actorUuid,
      action,
      comment: comment || null,
    });

  if (actError) throw new Error(actError.message);

  // 更新申請狀態
  if (action === "approve") {
    // 檢查是否還有下一步
    const { data: nextStep } = await supabase
      .from("approval_flow_steps")
      .select("step_order")
      .eq("approval_type_id", request.approval_type_id)
      .gt("step_order", request.current_step)
      .order("step_order")
      .limit(1)
      .single();

    if (nextStep) {
      await supabase
        .from("approval_requests")
        .update({ current_step: nextStep.step_order, status: "in_progress" })
        .eq("request_id", requestId);
    } else {
      await supabase
        .from("approval_requests")
        .update({ status: "approved" })
        .eq("request_id", requestId);
    }
  } else if (action === "reject") {
    await supabase
      .from("approval_requests")
      .update({ status: "rejected" })
      .eq("request_id", requestId);
  } else if (action === "return") {
    // 退回上一步
    const prevStep = Math.max(1, request.current_step - 1);
    await supabase
      .from("approval_requests")
      .update({ current_step: prevStep, status: "in_progress" })
      .eq("request_id", requestId);
  }
}
