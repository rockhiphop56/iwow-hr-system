-- ============================================================
-- 愛窩集團 多租戶人事與組織權限資料庫
-- Migration: 00003_seed_defaults
-- 種子資料：預設部門「總部」+ 預設職務「一般員工」
-- 供 Onboarding 流程自動指派使用
-- ============================================================

-- 預設部門：總部
INSERT INTO public.departments (dept_id, tenant_id, dept_name)
VALUES (
  'd0d0d0d0-0001-4000-a000-000000000001',
  '6b21c36f-53d4-4167-b848-61aed3a1c640',
  '總部'
)
ON CONFLICT (dept_id) DO NOTHING;

-- 預設職務：一般員工
INSERT INTO public.job_roles (role_id, tenant_id, role_name, job_level)
VALUES (
  'a0a0a0a0-0001-4000-b000-000000000001',
  '6b21c36f-53d4-4167-b848-61aed3a1c640',
  '一般員工',
  1
)
ON CONFLICT (role_id) DO NOTHING;

-- ============================================================
-- 為現有已登入用戶補上 profile_completed 標記
-- （若已手動設定過 tenant_id 的用戶，視為已完成 profile）
-- ============================================================
-- 可選：手動在 Supabase Dashboard 為既有用戶設定 user_metadata
-- UPDATE auth.users
-- SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
--   || '{"profile_completed": true}'::jsonb
-- WHERE id = 'YOUR_USER_ID';
