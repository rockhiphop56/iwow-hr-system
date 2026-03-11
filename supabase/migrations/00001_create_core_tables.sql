-- ============================================================
-- 愛窩集團 多租戶人事與組織權限資料庫
-- Migration: 00001_create_core_tables
-- 6 Core Tables + RLS Policies (tenant_id isolation)
-- ============================================================

-- 啟用 UUID 擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 輔助函式：從 JWT 取得當前使用者的 tenant_id
-- Supabase 慣例：將 tenant_id 寫入 app_metadata
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
$$;

-- ============================================================
-- 1. Tenants (租戶)
-- ============================================================
CREATE TABLE public.tenants (
  tenant_id   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_name TEXT        NOT NULL,
  tenant_type TEXT        NOT NULL CHECK (tenant_type IN ('company', 'franchise', 'branch')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tenants IS '租戶主表：每個加盟店/分公司為一個 tenant';

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_select ON public.tenants
  FOR SELECT USING (tenant_id = public.current_tenant_id());

CREATE POLICY tenants_insert ON public.tenants
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY tenants_update ON public.tenants
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY tenants_delete ON public.tenants
  FOR DELETE USING (tenant_id = public.current_tenant_id());

-- ============================================================
-- 2. Departments (行政組織 - 支援樹狀結構)
-- ============================================================
CREATE TABLE public.departments (
  dept_id        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  parent_dept_id UUID        REFERENCES public.departments(dept_id) ON DELETE SET NULL,
  dept_name      TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.departments IS '行政組織架構表，parent_dept_id 支援多層樹狀部門';

CREATE INDEX idx_departments_tenant ON public.departments(tenant_id);
CREATE INDEX idx_departments_parent ON public.departments(parent_dept_id);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY departments_select ON public.departments
  FOR SELECT USING (tenant_id = public.current_tenant_id());

CREATE POLICY departments_insert ON public.departments
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY departments_update ON public.departments
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY departments_delete ON public.departments
  FOR DELETE USING (tenant_id = public.current_tenant_id());

-- ============================================================
-- 3. Job_Roles (職等職務)
-- ============================================================
CREATE TABLE public.job_roles (
  role_id    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  role_name  TEXT        NOT NULL,
  job_level  INT         NOT NULL DEFAULT 1 CHECK (job_level >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.job_roles IS '職等職務表：定義租戶內的職務與職等層級';

CREATE INDEX idx_job_roles_tenant ON public.job_roles(tenant_id);

ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_roles_select ON public.job_roles
  FOR SELECT USING (tenant_id = public.current_tenant_id());

CREATE POLICY job_roles_insert ON public.job_roles
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY job_roles_update ON public.job_roles
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY job_roles_delete ON public.job_roles
  FOR DELETE USING (tenant_id = public.current_tenant_id());

-- ============================================================
-- 4. Employees (實體員工 - 跨租戶全域)
-- ============================================================
CREATE TABLE public.employees (
  user_uuid  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL UNIQUE,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.employees IS '全域員工表：一個人可透過 assignments 隸屬多個租戶';

-- Employees 本身無 tenant_id，透過 assignments 關聯
-- RLS 策略：只能看到與自己同 tenant 有 assignment 的員工
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY employees_select ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.user_uuid = employees.user_uuid
        AND a.tenant_id = public.current_tenant_id()
    )
  );

CREATE POLICY employees_insert ON public.employees
  FOR INSERT WITH CHECK (true);
  -- 新增員工後需立即建立 assignment 才可見

CREATE POLICY employees_update ON public.employees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.user_uuid = employees.user_uuid
        AND a.tenant_id = public.current_tenant_id()
    )
  );

CREATE POLICY employees_delete ON public.employees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.user_uuid = employees.user_uuid
        AND a.tenant_id = public.current_tenant_id()
    )
  );

-- ============================================================
-- 5. Assignments (行政任職樞紐)
-- ============================================================
CREATE TABLE public.assignments (
  assignment_id UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_uuid     UUID        NOT NULL REFERENCES public.employees(user_uuid) ON DELETE CASCADE,
  tenant_id     UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  dept_id       UUID        NOT NULL REFERENCES public.departments(dept_id) ON DELETE CASCADE,
  role_id       UUID        NOT NULL REFERENCES public.job_roles(role_id) ON DELETE CASCADE,
  manager_uuid  UUID        REFERENCES public.employees(user_uuid) ON DELETE SET NULL,
  status        TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  start_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  end_date      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 同一租戶內，同一員工同一部門同一職務只能有一筆 active
  CONSTRAINT uq_active_assignment UNIQUE (user_uuid, tenant_id, dept_id, role_id)
);

COMMENT ON TABLE public.assignments IS '行政任職樞紐：連結員工、租戶、部門、職務與行政主管';

CREATE INDEX idx_assignments_tenant   ON public.assignments(tenant_id);
CREATE INDEX idx_assignments_user     ON public.assignments(user_uuid);
CREATE INDEX idx_assignments_dept     ON public.assignments(dept_id);
CREATE INDEX idx_assignments_manager  ON public.assignments(manager_uuid);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY assignments_select ON public.assignments
  FOR SELECT USING (tenant_id = public.current_tenant_id());

CREATE POLICY assignments_insert ON public.assignments
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY assignments_update ON public.assignments
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY assignments_delete ON public.assignments
  FOR DELETE USING (tenant_id = public.current_tenant_id());

-- ============================================================
-- 6. Mentorships (師徒家族樞紐 - 高專師徒制分潤架構)
-- ============================================================
CREATE TABLE public.mentorships (
  relation_id      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID        NOT NULL REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  mentor_uuid      UUID        NOT NULL REFERENCES public.employees(user_uuid) ON DELETE CASCADE,
  apprentice_uuid  UUID        NOT NULL REFERENCES public.employees(user_uuid) ON DELETE CASCADE,
  generation_level INT         NOT NULL DEFAULT 1 CHECK (generation_level >= 1),
  status           TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'transferred', 'frozen')),
  start_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  end_date         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 同一租戶內，同一對師徒關係唯一
  CONSTRAINT uq_mentorship UNIQUE (tenant_id, mentor_uuid, apprentice_uuid),
  -- 導師不能是自己的徒弟
  CONSTRAINT chk_no_self_mentor CHECK (mentor_uuid <> apprentice_uuid)
);

COMMENT ON TABLE public.mentorships IS '師徒家族樞紐：generation_level=1 徒弟、2 徒孫，支援分潤計算';
COMMENT ON COLUMN public.mentorships.generation_level IS '1=直系徒弟，2=徒孫，3=徒曾孫，以此類推';

CREATE INDEX idx_mentorships_tenant     ON public.mentorships(tenant_id);
CREATE INDEX idx_mentorships_mentor     ON public.mentorships(mentor_uuid);
CREATE INDEX idx_mentorships_apprentice ON public.mentorships(apprentice_uuid);

ALTER TABLE public.mentorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY mentorships_select ON public.mentorships
  FOR SELECT USING (tenant_id = public.current_tenant_id());

CREATE POLICY mentorships_insert ON public.mentorships
  FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY mentorships_update ON public.mentorships
  FOR UPDATE USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY mentorships_delete ON public.mentorships
  FOR DELETE USING (tenant_id = public.current_tenant_id());

-- ============================================================
-- 自動更新 updated_at 觸發器
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_job_roles_updated_at
  BEFORE UPDATE ON public.job_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_mentorships_updated_at
  BEFORE UPDATE ON public.mentorships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
