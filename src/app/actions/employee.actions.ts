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

    // 1. 建立員工（含所有新欄位）
    const employee = await createEmployee({
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      // 新增欄位
      employee_no: dto.employee_no ?? null,
      gender: dto.gender ?? null,
      date_of_birth: dto.date_of_birth ?? null,
      address: dto.address ?? null,
      emergency_contact_name: dto.emergency_contact_name ?? null,
      emergency_contact_phone: dto.emergency_contact_phone ?? null,
      hire_date: dto.hire_date ?? null,
      contract_start_date: dto.contract_start_date ?? null,
      contract_end_date: dto.contract_end_date ?? null,
      rental_housing_cert_no: dto.rental_housing_cert_no ?? null,
      rental_housing_cert_expiry: dto.rental_housing_cert_expiry ?? null,
      real_estate_agent_no: dto.real_estate_agent_no ?? null,
      real_estate_agent_expiry: dto.real_estate_agent_expiry ?? null,
      real_estate_broker_no: dto.real_estate_broker_no ?? null,
      real_estate_broker_expiry: dto.real_estate_broker_expiry ?? null,
    });

    // 2. 建立行政任職
    await createAssignment({
      user_uuid: employee.user_uuid,
      tenant_id: session.tenantId,
      dept_id: dto.dept_id,
      role_id: dto.role_id,
      manager_uuid: dto.manager_uuid ?? null,
      employment_type_id: dto.employment_type_id ?? null,
      grade_id: dto.grade_id ?? null,
      is_dept_head: dto.is_dept_head ?? false,
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
    revalidatePath("/org-chart");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
