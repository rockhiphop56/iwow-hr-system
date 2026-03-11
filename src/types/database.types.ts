// ============================================================
// 愛窩集團 - 共用型別庫 (6 張核心資料表)
// ============================================================

export type TenantType = "company" | "franchise" | "branch";
export type AssignmentStatus = "active" | "inactive" | "suspended";
export type MentorshipStatus = "active" | "transferred" | "frozen";

// --- 1. Tenants ---
export interface Tenant {
  tenant_id: string;
  tenant_name: string;
  tenant_type: TenantType;
  created_at: string;
  updated_at: string;
}

// --- 2. Departments ---
export interface Department {
  dept_id: string;
  tenant_id: string;
  parent_dept_id: string | null;
  dept_name: string;
  created_at: string;
  updated_at: string;
}

// --- 3. Job Roles ---
export interface JobRole {
  role_id: string;
  tenant_id: string;
  role_name: string;
  job_level: number;
  created_at: string;
  updated_at: string;
}

// --- 4. Employees ---
export interface Employee {
  user_uuid: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// --- 5. Assignments ---
export interface Assignment {
  assignment_id: string;
  user_uuid: string;
  tenant_id: string;
  dept_id: string;
  role_id: string;
  manager_uuid: string | null;
  status: AssignmentStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// --- 6. Mentorships ---
export interface Mentorship {
  relation_id: string;
  tenant_id: string;
  mentor_uuid: string;
  apprentice_uuid: string;
  generation_level: number;
  status: MentorshipStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// --- 表單用 DTO ---
export interface CreateEmployeeDTO {
  name: string;
  email: string;
  phone?: string;
  dept_id: string;
  role_id: string;
  manager_uuid?: string;
  mentor_uuid?: string;
}

// --- 查詢用聯合型別 ---
export interface EmployeeWithAssignment extends Employee {
  assignment: Assignment | null;
  department: Department | null;
  role: JobRole | null;
  manager: Employee | null;
}

// --- Dashboard 統計 ---
export interface DashboardStats {
  totalEmployees: number;
  totalDepartments: number;
  totalMentorships: number;
  activeAssignments: number;
}
