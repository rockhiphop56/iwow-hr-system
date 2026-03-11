// ============================================================
// 愛窩集團 - 共用型別庫 (v0.4.0 — 16 張資料表)
// ============================================================

// --- Enum Types ---
export type TenantType = "company" | "franchise" | "branch";
export type AssignmentStatus = "active" | "inactive" | "suspended";
export type MentorshipStatus = "active" | "transferred" | "frozen";
export type Gender = "male" | "female" | "other";
export type DataScope = "all" | "department" | "mentorship" | "self";
export type ApproverType = "direct_manager" | "dept_head" | "specific_role" | "specific_user" | "hr";
export type ApprovalStatus = "pending" | "in_progress" | "approved" | "rejected" | "cancelled";
export type ApprovalAction = "approve" | "reject" | "return" | "comment";

// --- 1. Tenants ---
export interface Tenant {
  tenant_id: string;
  tenant_name: string;
  tenant_type: TenantType;
  parent_tenant_id: string | null;
  short_name: string | null;
  address: string | null;
  phone: string | null;
  tax_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- 2. Departments ---
export interface Department {
  dept_id: string;
  tenant_id: string;
  parent_dept_id: string | null;
  dept_name: string;
  dept_code: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- 3. Job Roles ---
export interface JobRole {
  role_id: string;
  tenant_id: string;
  role_name: string;
  job_level: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- 4. Employees ---
export interface Employee {
  user_uuid: string;
  name: string;
  email: string;
  phone: string | null;
  // 身份與聯絡
  employee_no: string | null;
  id_number: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  address: string | null;
  // 緊急聯絡人
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  // 工作資訊（勞僱 vs 承攬）
  hire_date: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  termination_date: string | null;
  // 產業專屬證照（含到期日）
  rental_housing_cert_no: string | null;
  rental_housing_cert_expiry: string | null;
  real_estate_agent_no: string | null;
  real_estate_agent_expiry: string | null;
  real_estate_broker_no: string | null;
  real_estate_broker_expiry: string | null;
  // 認證與第三方綁定
  phone_verified: boolean;
  line_user_id: string | null;
  // 其他
  avatar_url: string | null;
  notes: string | null;
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
  employment_type_id: string | null;
  grade_id: string | null;
  is_dept_head: boolean;
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

// --- 7. Employment Types ---
export interface EmploymentType {
  employment_type_id: string;
  tenant_id: string;
  type_name: string;
  type_code: string;
  is_contractor: boolean;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- 8. Job Grades ---
export interface JobGrade {
  grade_id: string;
  tenant_id: string;
  grade_name: string;
  grade_code: string;
  grade_rank: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- 9. Job Deputies ---
export interface JobDeputy {
  job_deputy_id: string;
  tenant_id: string;
  original_user_uuid: string;
  deputy_user_uuid: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- 10. Permissions ---
export interface Permission {
  permission_id: string;
  permission_key: string;
  permission_name: string;
  category: string;
  description: string | null;
  created_at: string;
}

// --- 11. Access Roles ---
export interface AccessRole {
  access_role_id: string;
  tenant_id: string;
  role_name: string;
  role_code: string;
  data_scope: DataScope;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- 12. Access Role Permissions ---
export interface AccessRolePermission {
  access_role_id: string;
  permission_id: string;
  created_at: string;
}

// --- 13. User Access Roles ---
export interface UserAccessRole {
  user_uuid: string;
  access_role_id: string;
  tenant_id: string;
  assigned_at: string;
}

// --- 14. Approval Types ---
export interface ApprovalType {
  approval_type_id: string;
  tenant_id: string;
  type_key: string;
  type_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- 15. Approval Flow Steps ---
export interface ApprovalFlowStep {
  step_id: string;
  approval_type_id: string;
  step_order: number;
  approver_type: ApproverType;
  approver_role_id: string | null;
  approver_user_uuid: string | null;
  description: string | null;
  created_at: string;
}

// --- 16. Approval Requests ---
export interface ApprovalRequest {
  request_id: string;
  tenant_id: string;
  approval_type_id: string;
  requester_uuid: string;
  current_step: number;
  status: ApprovalStatus;
  payload: Record<string, unknown>;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

// --- 17. Approval Actions ---
export interface ApprovalActionRecord {
  action_id: string;
  request_id: string;
  step_order: number;
  actor_uuid: string;
  action: ApprovalAction;
  comment: string | null;
  acted_at: string;
}

// ============================================================
// DTOs
// ============================================================

export interface CreateEmployeeDTO {
  name: string;
  email: string;
  phone?: string;
  dept_id: string;
  role_id: string;
  manager_uuid?: string;
  mentor_uuid?: string;
  // 新增欄位
  employee_no?: string;
  gender?: Gender;
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  hire_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  rental_housing_cert_no?: string;
  rental_housing_cert_expiry?: string;
  real_estate_agent_no?: string;
  real_estate_agent_expiry?: string;
  real_estate_broker_no?: string;
  real_estate_broker_expiry?: string;
  employment_type_id?: string;
  grade_id?: string;
  is_dept_head?: boolean;
}

// ============================================================
// 查詢用聯合型別
// ============================================================

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

// --- 到期提醒 ---
export interface ExpiryAlert {
  user_uuid: string;
  name: string;
  type: "contract" | "rental_housing_cert" | "real_estate_agent" | "real_estate_broker";
  expiry_date: string;
  days_remaining: number;
}

// --- 組織圖節點 ---
export interface OrgChartDeptNode extends Department {
  heads: (Pick<Employee, "user_uuid" | "name" | "avatar_url"> & { role_name: string | null })[];
  members: (Pick<Employee, "user_uuid" | "name" | "avatar_url"> & { role_name: string | null; is_dept_head: boolean })[];
  children: OrgChartDeptNode[];
}

// --- 師徒樹節點 ---
export interface MentorTreeNode {
  user_uuid: string;
  name: string;
  avatar_url: string | null;
  role_name: string | null;
  dept_name: string | null;
  apprentices: MentorTreeNode[];
}

// --- 權限檢查結果 ---
export interface UserPermissions {
  permissions: string[];
  dataScope: DataScope;
  roleIds: string[];
  deputyFor: string[];  // 正在代理的用戶 UUID 列表
}

// --- 簽核列表 ---
export interface ApprovalRequestWithDetails extends ApprovalRequest {
  type: ApprovalType;
  requester: Pick<Employee, "user_uuid" | "name">;
  actions: ApprovalActionRecord[];
}
