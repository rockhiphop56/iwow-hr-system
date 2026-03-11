"use server";

import { requireSession } from "@/lib/auth";
import { createEmployee } from "@/services/employees.service";
import { createAssignment } from "@/services/assignments.service";
import { createMentorship } from "@/services/mentorships.service";
import type { CreateEmployeeDTO } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createEmployeeAction(
  dto: CreateEmployeeDTO
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    // 1. 建立員工
    const employee = await createEmployee({
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
    });

    // 2. 建立行政任職
    await createAssignment({
      user_uuid: employee.user_uuid,
      tenant_id: session.tenantId,
      dept_id: dto.dept_id,
      role_id: dto.role_id,
      manager_uuid: dto.manager_uuid ?? null,
    });

    // 3. 若有指定導師，建立師徒關係
    if (dto.mentor_uuid) {
      await createMentorship({
        tenant_id: session.tenantId,
        mentor_uuid: dto.mentor_uuid,
        apprentice_uuid: employee.user_uuid,
        generation_level: 1,
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/employees");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
