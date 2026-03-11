import { createServerSupabase } from "@/services/supabase/server";
import type { Employee, EmployeeWithAssignment, DashboardStats } from "@/types/database.types";

/** 取得當前租戶下所有員工（含任職資訊） */
export async function getEmployeesWithAssignments(): Promise<EmployeeWithAssignment[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("assignments")
    .select(`
      *,
      employee:employees!user_uuid(*),
      department:departments!dept_id(*),
      role:job_roles!role_id(*),
      manager:employees!manager_uuid(*)
    `)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    ...row.employee,
    assignment: {
      assignment_id: row.assignment_id,
      user_uuid: row.user_uuid,
      tenant_id: row.tenant_id,
      dept_id: row.dept_id,
      role_id: row.role_id,
      manager_uuid: row.manager_uuid,
      status: row.status,
      start_date: row.start_date,
      end_date: row.end_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    department: row.department,
    role: row.role,
    manager: row.manager,
  }));
}

/** 取得可選為主管/導師的員工清單 */
export async function getEmployeeOptions(): Promise<Pick<Employee, "user_uuid" | "name">[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("assignments")
    .select("user_uuid, employee:employees!user_uuid(user_uuid, name)")
    .eq("status", "active");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    user_uuid: row.employee.user_uuid,
    name: row.employee.name,
  }));
}

/** 新增員工（寫入 employees 表） */
export async function createEmployee(
  payload: Pick<Employee, "name" | "email" | "phone">
): Promise<Employee> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("employees")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Dashboard 統計數字 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabase();

  const [empRes, deptRes, mentorRes, assignRes] = await Promise.all([
    supabase.from("assignments").select("user_uuid", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("departments").select("dept_id", { count: "exact", head: true }),
    supabase.from("mentorships").select("relation_id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("assignments").select("assignment_id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  return {
    totalEmployees: empRes.count ?? 0,
    totalDepartments: deptRes.count ?? 0,
    totalMentorships: mentorRes.count ?? 0,
    activeAssignments: assignRes.count ?? 0,
  };
}
