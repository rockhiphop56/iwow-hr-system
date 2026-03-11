import { createServerSupabase } from "@/services/supabase/server";
import type { Employee, EmployeeWithAssignment, DashboardStats, ExpiryAlert } from "@/types/database.types";

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
      employment_type_id: row.employment_type_id,
      grade_id: row.grade_id,
      is_dept_head: row.is_dept_head,
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

/** 新增員工（寫入 employees 表，含所有新欄位） */
export async function createEmployee(
  payload: Pick<Employee, "name" | "email"> & Partial<Omit<Employee, "user_uuid" | "created_at" | "updated_at">>
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

/** 更新員工資料 */
export async function updateEmployee(
  userUuid: string,
  payload: Partial<Omit<Employee, "user_uuid" | "created_at" | "updated_at">>
): Promise<Employee> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("user_uuid", userUuid)
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

/** 取得即將到期的承攬合約與證照（30天內） */
export async function getExpiryAlerts(): Promise<ExpiryAlert[]> {
  const supabase = await createServerSupabase();
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  const futureDate = thirtyDaysLater.toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const alerts: ExpiryAlert[] = [];

  // 1. 承攬到期
  const { data: contractors } = await supabase
    .from("employees")
    .select("user_uuid, name, contract_end_date")
    .not("contract_end_date", "is", null)
    .gte("contract_end_date", todayStr)
    .lte("contract_end_date", futureDate);

  (contractors ?? []).forEach((e: any) => {
    const days = Math.ceil((new Date(e.contract_end_date).getTime() - today.getTime()) / 86400000);
    alerts.push({ user_uuid: e.user_uuid, name: e.name, type: "contract", expiry_date: e.contract_end_date, days_remaining: days });
  });

  // 2. 租賃住宅管理人員證書到期
  const { data: cert1 } = await supabase
    .from("employees")
    .select("user_uuid, name, rental_housing_cert_expiry")
    .not("rental_housing_cert_expiry", "is", null)
    .gte("rental_housing_cert_expiry", todayStr)
    .lte("rental_housing_cert_expiry", futureDate);

  (cert1 ?? []).forEach((e: any) => {
    const days = Math.ceil((new Date(e.rental_housing_cert_expiry).getTime() - today.getTime()) / 86400000);
    alerts.push({ user_uuid: e.user_uuid, name: e.name, type: "rental_housing_cert", expiry_date: e.rental_housing_cert_expiry, days_remaining: days });
  });

  // 3. 不動產營業員證書到期
  const { data: cert2 } = await supabase
    .from("employees")
    .select("user_uuid, name, real_estate_agent_expiry")
    .not("real_estate_agent_expiry", "is", null)
    .gte("real_estate_agent_expiry", todayStr)
    .lte("real_estate_agent_expiry", futureDate);

  (cert2 ?? []).forEach((e: any) => {
    const days = Math.ceil((new Date(e.real_estate_agent_expiry).getTime() - today.getTime()) / 86400000);
    alerts.push({ user_uuid: e.user_uuid, name: e.name, type: "real_estate_agent", expiry_date: e.real_estate_agent_expiry, days_remaining: days });
  });

  // 4. 不動產經紀人證書到期
  const { data: cert3 } = await supabase
    .from("employees")
    .select("user_uuid, name, real_estate_broker_expiry")
    .not("real_estate_broker_expiry", "is", null)
    .gte("real_estate_broker_expiry", todayStr)
    .lte("real_estate_broker_expiry", futureDate);

  (cert3 ?? []).forEach((e: any) => {
    const days = Math.ceil((new Date(e.real_estate_broker_expiry).getTime() - today.getTime()) / 86400000);
    alerts.push({ user_uuid: e.user_uuid, name: e.name, type: "real_estate_broker", expiry_date: e.real_estate_broker_expiry, days_remaining: days });
  });

  return alerts.sort((a, b) => a.days_remaining - b.days_remaining);
}
