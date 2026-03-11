"use server";

import { requireSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import {
  createApprovalType,
  updateApprovalType,
  setFlowSteps,
  submitApprovalRequest,
  performApprovalAction,
} from "@/services/approval.service";
import type { ApproverType } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./employee.actions";

// ============================================================
// 簽核類型管理
// ============================================================

export async function createApprovalTypeAction(formData: {
  type_key: string;
  type_name: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("system.approval_types");

    await createApprovalType({
      tenant_id: session.tenantId,
      ...formData,
    });

    revalidatePath("/settings/approval-types");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateApprovalTypeAction(
  id: string,
  formData: {
    type_name?: string;
    description?: string;
    is_active?: boolean;
  }
): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("system.approval_types");

    await updateApprovalType(id, formData);

    revalidatePath("/settings/approval-types");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function setFlowStepsAction(
  typeId: string,
  steps: { step_order: number; approver_type: ApproverType; description?: string }[]
): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("system.approval_types");

    await setFlowSteps(typeId, steps.map((s) => ({ ...s, description: s.description ?? null })));

    revalidatePath("/settings/approval-types");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ============================================================
// 簽核申請 & 審批
// ============================================================

export async function submitApprovalAction(formData: {
  approval_type_id: string;
  payload: Record<string, unknown>;
  summary?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("approval.submit");

    await submitApprovalRequest({
      tenant_id: session.tenantId,
      requester_uuid: session.userId,
      ...formData,
    });

    revalidatePath("/approvals");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function performApprovalActionAction(
  requestId: string,
  action: "approve" | "reject" | "return" | "comment",
  comment?: string
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("approval.review");

    await performApprovalAction(requestId, session.userId, action, comment);

    revalidatePath("/approvals");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
