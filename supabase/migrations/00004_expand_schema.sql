-- ============================================================
-- 愛窩集團 多租戶人事與組織權限資料庫
-- Migration: 00004_expand_schema (v0.4.0)
-- 擴充員工欄位 + 組織架構 + 權限系統 + 簽核系統
-- ============================================================

-- ============================================================
-- PART 1: ALTER TABLE tenants +5
-- ============================================================
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES public.tenants(tenant_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT;

CREATE INDEX IF NOT EXISTS idx_tenants_parent ON public.tenants(parent_tenant_id);

-- ============================================================
-- PART 2: ALTER TABLE employees +22
-- ============================================================
ALTER TABLE public.employees
  -- 身份與聯絡
  ADD COLUMN IF NOT EXISTS employee_no TEXT,
  ADD COLUMN IF NOT EXISTS id_number TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address TEXT,
  -- 緊急聯絡人
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  -- 工作資訊（勞僱 vs 承攬）
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS contract_end_date DATE,
  ADD COLUMN IF NOT EXISTS termination_date DATE,
  -- 產業專屬證照（含到期日）
  ADD COLUMN IF NOT EXISTS rental_housing_cert_no TEXT,
  ADD COLUMN IF NOT EXISTS rental_housing_cert_expiry DATE,
  ADD COLUMN IF NOT EXISTS real_estate_agent_no TEXT,
  ADD COLUMN IF NOT EXISTS real_estate_agent_expiry DATE,
  ADD COLUMN IF NOT EXISTS real_estate_broker_no TEXT,
  ADD COLUMN IF NOT EXISTS real_estate_broker_expiry DATE,
  -- 認證與第三方綁定
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS line_user_id TEXT,
  -- 其他
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 身分證字號格式檢查
ALTER TABLE public.employees
  ADD CONSTRAINT chk_id_number CHECK (
    id_number IS NULL OR id_number ~ '^[A-Z][12]\d{8}$'
  );

-- 性別檢查
ALTER TABLE public.employees
  ADD CONSTRAINT chk_gender CHECK (
    gender IS NULL OR gender IN ('male', 'female', 'other')
  );

-- 索引
CREATE INDEX IF NOT EXISTS idx_employees_employee_no ON public.employees(employee_no);
CREATE INDEX IF NOT EXISTS idx_employees_line_user_id ON public.employees(line_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_contract_end ON public.employees(contract_end_date) WHERE contract_end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_cert_expiry ON public.employees(rental_housing_cert_expiry, real_estate_agent_expiry, real_estate_broker_expiry);

-- ============================================================
-- PART 3: ALTER TABLE departments +4
-- ============================================================
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS dept_code TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================
-- PART 4: ALTER TABLE job_roles +2
-- ============================================================
ALTER TABLE public.job_roles
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================
-- PART 5: ALTER TABLE assignments +3
-- ============================================================
-- employment_type_id 和 grade_id 的 FK 在建完新表後加
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS employment_type_id UUID,
  ADD COLUMN IF NOT EXISTS grade_id UUID,
  ADD COLUMN IF NOT EXISTS is_dept_head BOOLEAN DEFAULT false;

-- ============================================================
-- PART 6: CREATE employment_types（含 is_contractor 旗標）
-- ============================================================
CREATE TABLE public.employment_types (
  employment_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  type_name          TEXT        NOT NULL,
  type_code          TEXT        NOT NULL,
  is_contractor      BOOLEAN     NOT NULL DEFAULT false,
  description        TEXT,
  sort_order         INT         DEFAULT 0,
  is_active          BOOLEAN     DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_employment_type UNIQUE (tenant_id, type_code)
);

CREATE INDEX idx_employment_types_tenant ON public.employment_types(tenant_id);

ALTER TABLE public.employment_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY et_select ON public.employment_types FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY et_insert ON public.employment_types FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY et_update ON public.employment_types FOR UPDATE USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY et_delete ON public.employment_types FOR DELETE USING (tenant_id = public.current_tenant_id());

CREATE TRIGGER set_employment_types_updated_at BEFORE UPDATE ON public.employment_types FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PART 7: CREATE job_grades
-- ============================================================
CREATE TABLE public.job_grades (
  grade_id   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  grade_name TEXT        NOT NULL,
  grade_code TEXT        NOT NULL,
  grade_rank INT         NOT NULL DEFAULT 1,
  description TEXT,
  is_active  BOOLEAN     DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_job_grade UNIQUE (tenant_id, grade_code)
);

CREATE INDEX idx_job_grades_tenant ON public.job_grades(tenant_id);

ALTER TABLE public.job_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY jg_select ON public.job_grades FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY jg_insert ON public.job_grades FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY jg_update ON public.job_grades FOR UPDATE USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY jg_delete ON public.job_grades FOR DELETE USING (tenant_id = public.current_tenant_id());

CREATE TRIGGER set_job_grades_updated_at BEFORE UPDATE ON public.job_grades FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PART 5b: 為 assignments 補上 FK（表已建完）
-- ============================================================
ALTER TABLE public.assignments
  ADD CONSTRAINT fk_assignments_employment_type FOREIGN KEY (employment_type_id) REFERENCES public.employment_types(employment_type_id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_assignments_grade FOREIGN KEY (grade_id) REFERENCES public.job_grades(grade_id) ON DELETE SET NULL;

-- ============================================================
-- PART 8: CREATE job_deputies（職務代理人）
-- ============================================================
CREATE TABLE public.job_deputies (
  job_deputy_id      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id          UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  original_user_uuid UUID        NOT NULL REFERENCES public.employees(user_uuid) ON DELETE CASCADE,
  deputy_user_uuid   UUID        NOT NULL REFERENCES public.employees(user_uuid) ON DELETE CASCADE,
  start_date         DATE        NOT NULL,
  end_date           DATE        NOT NULL,
  reason             TEXT,
  is_active          BOOLEAN     DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_deputy_dates CHECK (end_date >= start_date),
  CONSTRAINT chk_no_self_deputy CHECK (original_user_uuid <> deputy_user_uuid)
);

CREATE INDEX idx_job_deputies_tenant ON public.job_deputies(tenant_id);
CREATE INDEX idx_job_deputies_original ON public.job_deputies(original_user_uuid);
CREATE INDEX idx_job_deputies_deputy ON public.job_deputies(deputy_user_uuid);
CREATE INDEX idx_job_deputies_active ON public.job_deputies(tenant_id, is_active) WHERE is_active = true;

ALTER TABLE public.job_deputies ENABLE ROW LEVEL SECURITY;
CREATE POLICY jd_select ON public.job_deputies FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY jd_insert ON public.job_deputies FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY jd_update ON public.job_deputies FOR UPDATE USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY jd_delete ON public.job_deputies FOR DELETE USING (tenant_id = public.current_tenant_id());

CREATE TRIGGER set_job_deputies_updated_at BEFORE UPDATE ON public.job_deputies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PART 9: CREATE permissions（全域權限定義，無 tenant_id）
-- ============================================================
CREATE TABLE public.permissions (
  permission_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_key  TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  category        TEXT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 全域表：所有人可讀
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY permissions_select ON public.permissions FOR SELECT USING (true);

-- ============================================================
-- PART 10: CREATE access_roles（含 data_scope）
-- ============================================================
CREATE TABLE public.access_roles (
  access_role_id UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  role_name      TEXT        NOT NULL,
  role_code      TEXT        NOT NULL,
  data_scope     TEXT        NOT NULL DEFAULT 'self' CHECK (data_scope IN ('all', 'department', 'mentorship', 'self')),
  description    TEXT,
  is_system      BOOLEAN     DEFAULT false,
  is_active      BOOLEAN     DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_access_role UNIQUE (tenant_id, role_code)
);

CREATE INDEX idx_access_roles_tenant ON public.access_roles(tenant_id);

ALTER TABLE public.access_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY ar_select ON public.access_roles FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY ar_insert ON public.access_roles FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY ar_update ON public.access_roles FOR UPDATE USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY ar_delete ON public.access_roles FOR DELETE USING (tenant_id = public.current_tenant_id());

CREATE TRIGGER set_access_roles_updated_at BEFORE UPDATE ON public.access_roles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PART 11: CREATE access_role_permissions
-- ============================================================
CREATE TABLE public.access_role_permissions (
  access_role_id UUID NOT NULL REFERENCES public.access_roles(access_role_id) ON DELETE CASCADE,
  permission_id  UUID NOT NULL REFERENCES public.permissions(permission_id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (access_role_id, permission_id)
);

ALTER TABLE public.access_role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY arp_select ON public.access_role_permissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.access_roles ar WHERE ar.access_role_id = access_role_permissions.access_role_id AND ar.tenant_id = public.current_tenant_id())
);
CREATE POLICY arp_insert ON public.access_role_permissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.access_roles ar WHERE ar.access_role_id = access_role_permissions.access_role_id AND ar.tenant_id = public.current_tenant_id())
);
CREATE POLICY arp_delete ON public.access_role_permissions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.access_roles ar WHERE ar.access_role_id = access_role_permissions.access_role_id AND ar.tenant_id = public.current_tenant_id())
);

-- ============================================================
-- PART 12: CREATE user_access_roles
-- ============================================================
CREATE TABLE public.user_access_roles (
  user_uuid      UUID        NOT NULL REFERENCES public.employees(user_uuid) ON DELETE CASCADE,
  access_role_id UUID        NOT NULL REFERENCES public.access_roles(access_role_id) ON DELETE CASCADE,
  tenant_id      UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_uuid, access_role_id, tenant_id)
);

CREATE INDEX idx_user_access_roles_user ON public.user_access_roles(user_uuid);
CREATE INDEX idx_user_access_roles_tenant ON public.user_access_roles(tenant_id);

ALTER TABLE public.user_access_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY uar_select ON public.user_access_roles FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY uar_insert ON public.user_access_roles FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY uar_delete ON public.user_access_roles FOR DELETE USING (tenant_id = public.current_tenant_id());

-- ============================================================
-- PART 13: CREATE approval_types
-- ============================================================
CREATE TABLE public.approval_types (
  approval_type_id UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  type_key         TEXT        NOT NULL,
  type_name        TEXT        NOT NULL,
  description      TEXT,
  is_active        BOOLEAN     DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_approval_type UNIQUE (tenant_id, type_key)
);

CREATE INDEX idx_approval_types_tenant ON public.approval_types(tenant_id);

ALTER TABLE public.approval_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY at_select ON public.approval_types FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY at_insert ON public.approval_types FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY at_update ON public.approval_types FOR UPDATE USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY at_delete ON public.approval_types FOR DELETE USING (tenant_id = public.current_tenant_id());

CREATE TRIGGER set_approval_types_updated_at BEFORE UPDATE ON public.approval_types FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PART 14: CREATE approval_flow_steps
-- ============================================================
CREATE TABLE public.approval_flow_steps (
  step_id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_type_id UUID        NOT NULL REFERENCES public.approval_types(approval_type_id) ON DELETE CASCADE,
  step_order       INT         NOT NULL,
  approver_type    TEXT        NOT NULL CHECK (approver_type IN ('direct_manager', 'dept_head', 'specific_role', 'specific_user', 'hr')),
  approver_role_id UUID        REFERENCES public.access_roles(access_role_id) ON DELETE SET NULL,
  approver_user_uuid UUID      REFERENCES public.employees(user_uuid) ON DELETE SET NULL,
  description      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_flow_step UNIQUE (approval_type_id, step_order)
);

ALTER TABLE public.approval_flow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY afs_select ON public.approval_flow_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.approval_types at2 WHERE at2.approval_type_id = approval_flow_steps.approval_type_id AND at2.tenant_id = public.current_tenant_id())
);
CREATE POLICY afs_insert ON public.approval_flow_steps FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.approval_types at2 WHERE at2.approval_type_id = approval_flow_steps.approval_type_id AND at2.tenant_id = public.current_tenant_id())
);
CREATE POLICY afs_update ON public.approval_flow_steps FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.approval_types at2 WHERE at2.approval_type_id = approval_flow_steps.approval_type_id AND at2.tenant_id = public.current_tenant_id())
);
CREATE POLICY afs_delete ON public.approval_flow_steps FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.approval_types at2 WHERE at2.approval_type_id = approval_flow_steps.approval_type_id AND at2.tenant_id = public.current_tenant_id())
);

-- ============================================================
-- PART 15: CREATE approval_requests
-- ============================================================
CREATE TABLE public.approval_requests (
  request_id      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  approval_type_id UUID       NOT NULL REFERENCES public.approval_types(approval_type_id) ON DELETE CASCADE,
  requester_uuid  UUID        NOT NULL REFERENCES public.employees(user_uuid) ON DELETE CASCADE,
  current_step    INT         NOT NULL DEFAULT 1,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'cancelled')),
  payload         JSONB       NOT NULL DEFAULT '{}',
  summary         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_requests_tenant ON public.approval_requests(tenant_id);
CREATE INDEX idx_approval_requests_requester ON public.approval_requests(requester_uuid);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(tenant_id, status);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY areq_select ON public.approval_requests FOR SELECT USING (tenant_id = public.current_tenant_id());
CREATE POLICY areq_insert ON public.approval_requests FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY areq_update ON public.approval_requests FOR UPDATE USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

CREATE TRIGGER set_approval_requests_updated_at BEFORE UPDATE ON public.approval_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PART 16: CREATE approval_actions
-- ============================================================
CREATE TABLE public.approval_actions (
  action_id   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id  UUID        NOT NULL REFERENCES public.approval_requests(request_id) ON DELETE CASCADE,
  step_order  INT         NOT NULL,
  actor_uuid  UUID        NOT NULL REFERENCES public.employees(user_uuid) ON DELETE CASCADE,
  action      TEXT        NOT NULL CHECK (action IN ('approve', 'reject', 'return', 'comment')),
  comment     TEXT,
  acted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_actions_request ON public.approval_actions(request_id);

ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY aa_select ON public.approval_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.approval_requests ar WHERE ar.request_id = approval_actions.request_id AND ar.tenant_id = public.current_tenant_id())
);
CREATE POLICY aa_insert ON public.approval_actions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.approval_requests ar WHERE ar.request_id = approval_actions.request_id AND ar.tenant_id = public.current_tenant_id())
);

-- ============================================================
-- PART 17: Seed 僱用類型 6 筆
-- ============================================================
INSERT INTO public.employment_types (employment_type_id, tenant_id, type_name, type_code, is_contractor, sort_order) VALUES
  ('b1b1b1b1-0001-4000-a000-000000000001', '6b21c36f-53d4-4167-b848-61aed3a1c640', '正職', 'full_time', false, 1),
  ('b1b1b1b1-0002-4000-a000-000000000002', '6b21c36f-53d4-4167-b848-61aed3a1c640', '兼職', 'part_time', false, 2),
  ('b1b1b1b1-0003-4000-a000-000000000003', '6b21c36f-53d4-4167-b848-61aed3a1c640', '實習', 'intern', false, 3),
  ('b1b1b1b1-0004-4000-a000-000000000004', '6b21c36f-53d4-4167-b848-61aed3a1c640', '約聘', 'contract', false, 4),
  ('b1b1b1b1-0005-4000-a000-000000000005', '6b21c36f-53d4-4167-b848-61aed3a1c640', '承攬', 'outsource', true, 5),
  ('b1b1b1b1-0006-4000-a000-000000000006', '6b21c36f-53d4-4167-b848-61aed3a1c640', '顧問', 'consultant', true, 6)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART 18: Seed 權限 ~15 筆
-- ============================================================
INSERT INTO public.permissions (permission_id, permission_key, permission_name, category, description) VALUES
  -- 員工管理
  ('c1c1c1c1-0001-4000-a000-000000000001', 'employee.view',       '檢視員工資料', '員工管理', '查看員工基本資料'),
  ('c1c1c1c1-0002-4000-a000-000000000002', 'employee.create',     '新增員工',     '員工管理', '建立新員工記錄'),
  ('c1c1c1c1-0003-4000-a000-000000000003', 'employee.edit',       '編輯員工資料', '員工管理', '修改員工資訊'),
  ('c1c1c1c1-0004-4000-a000-000000000004', 'employee.delete',     '刪除員工',     '員工管理', '刪除員工記錄'),
  -- 組織管理
  ('c1c1c1c1-0005-4000-a000-000000000005', 'org.view',            '檢視組織架構', '組織管理', '查看組織圖'),
  ('c1c1c1c1-0006-4000-a000-000000000006', 'org.edit',            '編輯組織架構', '組織管理', '編輯部門與人員指派'),
  -- 設定管理
  ('c1c1c1c1-0007-4000-a000-000000000007', 'settings.departments','部門設定',     '參數設定', '管理部門'),
  ('c1c1c1c1-0008-4000-a000-000000000008', 'settings.roles',      '職務設定',     '參數設定', '管理職務'),
  ('c1c1c1c1-0009-4000-a000-000000000009', 'settings.grades',     '職等設定',     '參數設定', '管理職等'),
  ('c1c1c1c1-000a-4000-a000-00000000000a', 'settings.emp_types',  '僱用類型設定', '參數設定', '管理僱用類型'),
  ('c1c1c1c1-000b-4000-a000-00000000000b', 'settings.deputies',   '代理人設定',   '參數設定', '管理職務代理人'),
  ('c1c1c1c1-000c-4000-a000-00000000000c', 'settings.tenants',    '公司管理',     '參數設定', '管理公司/分店'),
  -- 系統管理
  ('c1c1c1c1-000d-4000-a000-00000000000d', 'system.roles',        '角色權限管理', '系統管理', '管理存取角色與權限'),
  ('c1c1c1c1-000e-4000-a000-00000000000e', 'system.approval_types','簽核類型設定','系統管理', '管理簽核類型'),
  -- 簽核
  ('c1c1c1c1-000f-4000-a000-00000000000f', 'approval.submit',     '提交簽核',     '簽核管理', '提交簽核申請'),
  ('c1c1c1c1-0010-4000-a000-000000000010', 'approval.review',     '審批簽核',     '簽核管理', '審核簽核申請')
ON CONFLICT (permission_key) DO NOTHING;

-- ============================================================
-- PART 19: Seed 預設角色 4 筆 + 權限映射
-- ============================================================
INSERT INTO public.access_roles (access_role_id, tenant_id, role_name, role_code, data_scope, is_system, description) VALUES
  ('e1e1e1e1-0001-4000-a000-000000000001', '6b21c36f-53d4-4167-b848-61aed3a1c640', '超級管理員', 'super_admin', 'all', true, '擁有所有權限'),
  ('e1e1e1e1-0002-4000-a000-000000000002', '6b21c36f-53d4-4167-b848-61aed3a1c640', 'HR 管理員',  'hr_admin',    'all', true, '人事管理全部權限'),
  ('e1e1e1e1-0003-4000-a000-000000000003', '6b21c36f-53d4-4167-b848-61aed3a1c640', '部門主管',   'dept_manager','department', true, '管理部門成員'),
  ('e1e1e1e1-0004-4000-a000-000000000004', '6b21c36f-53d4-4167-b848-61aed3a1c640', '一般員工',   'employee',    'self', true, '基本存取權限')
ON CONFLICT (tenant_id, role_code) DO NOTHING;

-- 超級管理員：所有權限
INSERT INTO public.access_role_permissions (access_role_id, permission_id)
SELECT 'e1e1e1e1-0001-4000-a000-000000000001', permission_id FROM public.permissions
ON CONFLICT DO NOTHING;

-- HR 管理員：員工管理 + 組織管理 + 設定管理 + 簽核
INSERT INTO public.access_role_permissions (access_role_id, permission_id)
SELECT 'e1e1e1e1-0002-4000-a000-000000000002', permission_id FROM public.permissions
WHERE permission_key LIKE 'employee.%' OR permission_key LIKE 'org.%' OR permission_key LIKE 'settings.%' OR permission_key LIKE 'approval.%'
ON CONFLICT DO NOTHING;

-- 部門主管：檢視+編輯員工 + 組織檢視 + 簽核
INSERT INTO public.access_role_permissions (access_role_id, permission_id)
SELECT 'e1e1e1e1-0003-4000-a000-000000000003', permission_id FROM public.permissions
WHERE permission_key IN ('employee.view', 'employee.edit', 'org.view', 'approval.submit', 'approval.review')
ON CONFLICT DO NOTHING;

-- 一般員工：檢視員工 + 組織圖 + 提交簽核
INSERT INTO public.access_role_permissions (access_role_id, permission_id)
SELECT 'e1e1e1e1-0004-4000-a000-000000000004', permission_id FROM public.permissions
WHERE permission_key IN ('employee.view', 'org.view', 'approval.submit')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART 20: Seed 簽核類型 5 筆 + 預設流程
-- ============================================================
INSERT INTO public.approval_types (approval_type_id, tenant_id, type_key, type_name, description) VALUES
  ('f1f1f1f1-0001-4000-a000-000000000001', '6b21c36f-53d4-4167-b848-61aed3a1c640', 'transfer',    '人員調動', '部門調動或職務變更'),
  ('f1f1f1f1-0002-4000-a000-000000000002', '6b21c36f-53d4-4167-b848-61aed3a1c640', 'promotion',   '升遷/降職', '職等或職務調整'),
  ('f1f1f1f1-0003-4000-a000-000000000003', '6b21c36f-53d4-4167-b848-61aed3a1c640', 'resignation', '離職',     '員工離職申請'),
  ('f1f1f1f1-0004-4000-a000-000000000004', '6b21c36f-53d4-4167-b848-61aed3a1c640', 'data_change', '敏感資料變更', '修改身分證、銀行帳號等'),
  ('f1f1f1f1-0005-4000-a000-000000000005', '6b21c36f-53d4-4167-b848-61aed3a1c640', 'new_hire',    '新進報到確認', 'HR 建立後由主管確認')
ON CONFLICT (tenant_id, type_key) DO NOTHING;

-- 人員調動流程：原主管 → 新主管 → HR
INSERT INTO public.approval_flow_steps (approval_type_id, step_order, approver_type, description) VALUES
  ('f1f1f1f1-0001-4000-a000-000000000001', 1, 'direct_manager', '原部門主管審核'),
  ('f1f1f1f1-0001-4000-a000-000000000001', 2, 'dept_head', '新部門主管確認'),
  ('f1f1f1f1-0001-4000-a000-000000000001', 3, 'hr', 'HR 最終確認')
ON CONFLICT (approval_type_id, step_order) DO NOTHING;

-- 升遷流程：部門主管 → HR → 管理層
INSERT INTO public.approval_flow_steps (approval_type_id, step_order, approver_type, description) VALUES
  ('f1f1f1f1-0002-4000-a000-000000000002', 1, 'dept_head', '部門主管推薦'),
  ('f1f1f1f1-0002-4000-a000-000000000002', 2, 'hr', 'HR 審核'),
  ('f1f1f1f1-0002-4000-a000-000000000002', 3, 'specific_role', '管理層核定')
ON CONFLICT (approval_type_id, step_order) DO NOTHING;

-- 離職流程：直屬主管 → HR
INSERT INTO public.approval_flow_steps (approval_type_id, step_order, approver_type, description) VALUES
  ('f1f1f1f1-0003-4000-a000-000000000003', 1, 'direct_manager', '直屬主管確認'),
  ('f1f1f1f1-0003-4000-a000-000000000003', 2, 'hr', 'HR 辦理離職')
ON CONFLICT (approval_type_id, step_order) DO NOTHING;

-- 敏感資料變更：HR 審核
INSERT INTO public.approval_flow_steps (approval_type_id, step_order, approver_type, description) VALUES
  ('f1f1f1f1-0004-4000-a000-000000000004', 1, 'hr', 'HR 審核確認')
ON CONFLICT (approval_type_id, step_order) DO NOTHING;

-- 新進報到：HR → 部門主管
INSERT INTO public.approval_flow_steps (approval_type_id, step_order, approver_type, description) VALUES
  ('f1f1f1f1-0005-4000-a000-000000000005', 1, 'hr', 'HR 建立報到資料'),
  ('f1f1f1f1-0005-4000-a000-000000000005', 2, 'dept_head', '部門主管確認')
ON CONFLICT (approval_type_id, step_order) DO NOTHING;

-- ============================================================
-- PART 21: 更新 Angus → 超級管理員
-- ============================================================
INSERT INTO public.user_access_roles (user_uuid, access_role_id, tenant_id)
VALUES (
  '7cf497e6-b838-4f42-849f-e3793089a86e',
  'e1e1e1e1-0001-4000-a000-000000000001',
  '6b21c36f-53d4-4167-b848-61aed3a1c640'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART 22: 更新現有租戶加 short_name
-- ============================================================
UPDATE public.tenants
SET short_name = '愛窩總部'
WHERE tenant_id = '6b21c36f-53d4-4167-b848-61aed3a1c640'
  AND short_name IS NULL;

-- ============================================================
-- 表註解
-- ============================================================
COMMENT ON TABLE public.employment_types IS '僱用類型：正職/兼職/實習/約聘/承攬/顧問，is_contractor 標記承攬類型';
COMMENT ON TABLE public.job_grades IS '職等表：定義職等層級';
COMMENT ON TABLE public.job_deputies IS '職務代理人：代理期間內代理人擁有被代理人所有權限';
COMMENT ON TABLE public.permissions IS '全域權限定義表：所有租戶共用';
COMMENT ON TABLE public.access_roles IS '存取角色：含 data_scope 控制資料可見範圍';
COMMENT ON TABLE public.access_role_permissions IS '角色權限映射表';
COMMENT ON TABLE public.user_access_roles IS '用戶角色指派表';
COMMENT ON TABLE public.approval_types IS '簽核類型定義';
COMMENT ON TABLE public.approval_flow_steps IS '簽核流程步驟：定義每個簽核類型的審批順序';
COMMENT ON TABLE public.approval_requests IS '簽核申請：每筆簽核請求';
COMMENT ON TABLE public.approval_actions IS '簽核操作記錄：每步審批動作';
