import { createServerSupabase } from "@/services/supabase/server";
import type { Department, JobRole } from "@/types/database.types";

/** 取得當前租戶所有部門 */
export async function getDepartments(): Promise<Department[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("dept_name");

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
