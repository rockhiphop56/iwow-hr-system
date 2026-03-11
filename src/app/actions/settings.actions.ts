"use server";

import { requireSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/services/departments.service";
import {
  createJobRole,
  updateJobRole,
  deleteJobRole,
} from "@/services/job-roles.service";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./employee.actions";

// ============================================================
// 部門 CRUD
// ============================================================

export async function createDepartmentAction(formData: {
  dept_name: string;
  parent_dept_id?: string;
  dept_code?: string;
  description?: string;
  sort_order?: number;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("settings.departments");

    await createDepartment({
      tenant_id: session.tenantId,
      dept_name: formData.dept_name,
      parent_dept_id: formData.parent_dept_id || null,
      dept_code: formData.dept_code,
      description: formData.description,
      sort_order: formData.sort_order,
    });

    revalidatePath("/settings/departments");
    revalidatePath("/org-chart");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateDepartmentAction(
  deptId: string,
  formData: {
    dept_name?: string;
    parent_dept_id?: string | null;
    dept_code?: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }
): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.departments");

    await updateDepartment(deptId, formData);

    revalidatePath("/settings/departments");
    revalidatePath("/org-chart");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteDepartmentAction(deptId: string): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.departments");

    await deleteDepartment(deptId);

    revalidatePath("/settings/departments");
    revalidatePath("/org-chart");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ============================================================
// 職務 CRUD
// ============================================================

export async function createJobRoleAction(formData: {
  role_name: string;
  job_level: number;
  description?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("settings.roles");

    await createJobRole({
      tenant_id: session.tenantId,
      role_name: formData.role_name,
      job_level: formData.job_level,
      description: formData.description,
    });

    revalidatePath("/settings/job-roles");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateJobRoleAction(
  roleId: string,
  formData: {
    role_name?: string;
    job_level?: number;
    description?: string;
    is_active?: boolean;
  }
): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.roles");

    await updateJobRole(roleId, formData);

    revalidatePath("/settings/job-roles");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteJobRoleAction(roleId: string): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.roles");

    await deleteJobRole(roleId);

    revalidatePath("/settings/job-roles");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
