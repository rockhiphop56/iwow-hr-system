-- ============================================================
-- 愛窩集團 多租戶人事與組織權限資料庫
-- Migration: 00002_seed_tenant_and_auto_assign
-- 種子資料：預設租戶 + 新用戶自動指派觸發器
-- ============================================================

-- ============================================================
-- PART 1: 種子租戶（愛窩集團總部）
-- ============================================================
INSERT INTO public.tenants (tenant_id, tenant_name, tenant_type)
VALUES (
  '6b21c36f-53d4-4167-b848-61aed3a1c640',
  '愛窩集團總部',
  'company'
)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================
-- PART 2: 新用戶自動指派預設租戶觸發器
-- 當 auth.users 新增用戶時，自動將預設 tenant_id 寫入 app_metadata
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  default_tenant_id UUID := '6b21c36f-53d4-4167-b848-61aed3a1c640';
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('tenant_id', default_tenant_id::text)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 確保觸發器不重複
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 註解
-- ============================================================
COMMENT ON FUNCTION public.handle_new_user() IS '新用戶註冊時自動指派預設租戶 tenant_id 至 app_metadata';
