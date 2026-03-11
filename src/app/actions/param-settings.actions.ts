"use server";

import { requireSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import {
  createEmploymentType,
  updateEmploymentType,
  deleteEmploymentType,
} from "@/services/employment-types.service";
import {
  createJobGrade,
  updateJobGrade,
  deleteJobGrade,
} from "@/services/job-grades.service";
import {
  createJobDeputy,
  updateJobDeputy,
  deleteJobDeputy,
} from "@/services/job-deputies.service";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./employee.actions";

// ============================================================
// 僱用類型 CRUD
// ============================================================

export async function createEmploymentTypeAction(formData: {
  type_name: string;
  type_code: string;
  is_contractor: boolean;
  description?: string;
  sort_order?: number;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("settings.emp_types");

    await createEmploymentType({
      tenant_id: session.tenantId,
      ...formData,
    });

    revalidatePath("/settings/employment-types");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateEmploymentTypeAction(
  id: string,
  formData: {
    type_name?: string;
    type_code?: string;
    is_contractor?: boolean;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.emp_types");

    await updateEmploymentType(id, formData);

    revalidatePath("/settings/employment-types");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteEmploymentTypeAction(id: string): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.emp_types");

    await deleteEmploymentType(id);

    revalidatePath("/settings/employment-types");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ============================================================
// 職等 CRUD
// ============================================================

export async function createJobGradeAction(formData: {
  grade_name: string;
  grade_code: string;
  grade_rank: number;
  description?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("settings.grades");

    await createJobGrade({
      tenant_id: session.tenantId,
      ...formData,
    });

    revalidatePath("/settings/job-grades");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateJobGradeAction(
  id: string,
  formData: {
    grade_name?: string;
    grade_code?: string;
    grade_rank?: number;
    description?: string;
    is_active?: boolean;
  }
): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.grades");

    await updateJobGrade(id, formData);

    revalidatePath("/settings/job-grades");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteJobGradeAction(id: string): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.grades");

    await deleteJobGrade(id);

    revalidatePath("/settings/job-grades");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ============================================================
// 職務代理人 CRUD
// ============================================================

export async function createJobDeputyAction(formData: {
  original_user_uuid: string;
  deputy_user_uuid: string;
  start_date: string;
  end_date: string;
  reason?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("settings.deputies");

    await createJobDeputy({
      tenant_id: session.tenantId,
      ...formData,
    });

    revalidatePath("/settings/job-deputies");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateJobDeputyAction(
  id: string,
  formData: {
    start_date?: string;
    end_date?: string;
    reason?: string;
    is_active?: boolean;
  }
): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.deputies");

    await updateJobDeputy(id, formData);

    revalidatePath("/settings/job-deputies");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteJobDeputyAction(id: string): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.deputies");

    await deleteJobDeputy(id);

    revalidatePath("/settings/job-deputies");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
