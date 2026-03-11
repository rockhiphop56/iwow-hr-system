"use server";

import { requireSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { updateTenant } from "@/services/tenants.service";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./employee.actions";

export async function updateTenantAction(
  tenantId: string,
  formData: {
    tenant_name?: string;
    short_name?: string;
    address?: string;
    phone?: string;
    tax_id?: string;
  }
): Promise<ActionResult> {
  try {
    await requireSession();
    await requirePermission("settings.tenants");

    await updateTenant(tenantId, formData);

    revalidatePath("/settings/tenants");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
