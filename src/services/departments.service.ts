import { createServerSupabase } from "@/services/supabase/server";
import type { Department, JobRole, OrgChartDeptNode } from "@/types/database.types";

/** 取得當前租戶所有部門 */
export async function getDepartments(): Promise<Department[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("sort_order, dept_name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 取得部門樹狀結構 */
export interface DeptTreeNode extends Department {
  children: DeptTreeNode[];
}

export function buildDeptTree(departments: Department[]): DeptTreeNode[] {
  const map = new Map<string, DeptTreeNode>();
  const roots: DeptTreeNode[] = [];

  departments.forEach((d) => {
    map.set(d.dept_id, { ...d, children: [] });
  });

  departments.forEach((d) => {
    const node = map.get(d.dept_id)!;
    if (d.parent_dept_id && map.has(d.parent_dept_id)) {
      map.get(d.parent_dept_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/** 取得當前租戶所有職務 */
export async function getJobRoles(): Promise<JobRole[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("job_roles")
    .select("*")
    .order("job_level");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 新增部門 */
export async function createDepartment(
  payload: Pick<Department, "tenant_id" | "dept_name"> & Partial<Pick<Department, "parent_dept_id" | "dept_code" | "description" | "sort_order">>
): Promise<Department> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("departments")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 更新部門 */
export async function updateDepartment(
  deptId: string,
  payload: Partial<Pick<Department, "dept_name" | "parent_dept_id" | "dept_code" | "description" | "sort_order" | "is_active">>
): Promise<Department> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("departments")
    .update(payload)
    .eq("dept_id", deptId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 刪除部門 */
export async function deleteDepartment(deptId: string): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("dept_id", deptId);

  if (error) throw new Error(error.message);
}

/**
 * 建構行政組織圖資料
 * 查詢所有部門 + 員工任職 + 主管標記
 */
export async function buildOrgTree(): Promise<OrgChartDeptNode[]> {
  const supabase = await createServerSupabase();

  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("*")
    .eq("is_active", true)
    .order("sort_order, dept_name");

  if (deptError) throw new Error(deptError.message);

  const { data: assignments, error: assignError } = await supabase
    .from("assignments")
    .select(`
      user_uuid, dept_id, is_dept_head,
      employee:employees!user_uuid(user_uuid, name, avatar_url),
      role:job_roles!role_id(role_name)
    `)
    .eq("status", "active");

  if (assignError) throw new Error(assignError.message);

  const deptMembers = new Map<string, { user_uuid: string; name: string; avatar_url: string | null; role_name: string | null; is_dept_head: boolean }[]>();

  (assignments ?? []).forEach((a: any) => {
    const member = {
      user_uuid: a.employee?.user_uuid ?? a.user_uuid,
      name: a.employee?.name ?? "未知",
      avatar_url: a.employee?.avatar_url ?? null,
      role_name: a.role?.role_name ?? null,
      is_dept_head: a.is_dept_head ?? false,
    };

    if (!deptMembers.has(a.dept_id)) {
      deptMembers.set(a.dept_id, []);
    }
    deptMembers.get(a.dept_id)!.push(member);
  });

  const map = new Map<string, OrgChartDeptNode>();
  const roots: OrgChartDeptNode[] = [];

  (departments ?? []).forEach((d: any) => {
    const members = deptMembers.get(d.dept_id) ?? [];
    const heads = members.filter((m) => m.is_dept_head);
    const nonHeads = members.filter((m) => !m.is_dept_head);

    map.set(d.dept_id, {
      ...d,
      heads,
      members: nonHeads,
      children: [],
    });
  });

  (departments ?? []).forEach((d: any) => {
    const node = map.get(d.dept_id)!;
    if (d.parent_dept_id && map.has(d.parent_dept_id)) {
      map.get(d.parent_dept_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
