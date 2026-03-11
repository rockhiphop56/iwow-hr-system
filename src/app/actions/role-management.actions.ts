"use server";

import { requireSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import {
  createAccessRole,
  updateAccessRole,
  setRolePermissions,
  assignRoleToUser,
  removeRoleFromUser,
} from "@/services/access-roles.service";
import type { DataScope } from "@/types/database.types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./employee.actions";

export async function createAccessRoleAction(formData: {
  role_name: string;
  role_code: string;
  data_scope: DataScope;
  description?: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("system.roles");

    await createAccessRole({
      tenant_id: session.tenantId,
      ...formData,
    });

    revalidatePath("/settings/roles");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateAccessRoleAction(
  id: string,
  formData: {
    role_name?: string;
    role_code?: string;
    data_scope?: DataScope;
    description?: string;
    is_active?: boolean;
  }
): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("system.roles");

    await updateAccessRole(id, formData);

    revalidatePath("/settings/roles");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function setRolePermissionsAction(
  roleId: string,
  permissionIds: string[]
): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("system.roles");

    await setRolePermissions(roleId, permissionIds);

    revalidatePath("/settings/roles");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function assignRoleAction(
  userUuid: string,
  roleId: string
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("system.roles");

    await assignRoleToUser(userUuid, roleId, session.tenantId);

    revalidatePath("/settings/roles");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function removeRoleAction(
  userUuid: string,
  roleId: string
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await requirePermission("system.roles");

    await removeRoleFromUser(userUuid, roleId, session.tenantId);

    revalidatePath("/settings/roles");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
