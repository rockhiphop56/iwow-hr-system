# 愛窩集團 - 多租戶人事與組織權限資料庫

## 目錄結構 (Feature-Sliced Design)

```
人事資料庫/
├── ARCHITECTURE.md              ← 本文件（AI 記憶錨點）
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example
│
├── supabase/
│   └── migrations/
│       └── 00001_create_core_tables.sql   ← 6 張核心表 + RLS
│
└── src/
    ├── middleware.ts              ← Session 驗證 + tenant_id 注入
    │
    ├── types/
    │   └── database.types.ts     ← 共用型別庫（6 表 + DTO + 聯合型別）
    │
    ├── lib/
    │   └── auth.ts               ← getSession / requireSession
    │
    ├── services/
    │   ├── supabase/
    │   │   ├── client.ts         ← Browser Client
    │   │   └── server.ts         ← Server Client (cookie-based)
    │   ├── employees.service.ts  ← 員工 CRUD + Dashboard 統計
    │   ├── departments.service.ts← 部門 + 職務 + 樹狀結構
    │   ├── assignments.service.ts← 行政任職建立
    │   └── mentorships.service.ts← 師徒關係 CRUD
    │
    ├── app/
    │   ├── layout.tsx            ← 全域 Layout + Sidebar
    │   ├── page.tsx              ← 重導 /dashboard
    │   ├── globals.css           ← TailwindCSS + 自訂元件樣式
    │   ├── login/
    │   │   └── page.tsx          ← OTP 登入頁
    │   ├── dashboard/
    │   │   └── page.tsx          ← 儀表板（Server Component）
    │   ├── employees/
    │   │   └── new/
    │   │       └── page.tsx      ← 新增員工頁（Server → Client 混合）
    │   └── actions/
    │       └── employee.actions.ts ← Server Actions（新增員工交易）
    │
    └── components/
        ├── dashboard/
        │   ├── StatsCards.tsx     ← 四大統計卡片
        │   ├── EmployeeTable.tsx  ← 員工列表表格
        │   └── DepartmentTree.tsx ← 遞迴部門樹
        └── employees/
            └── EmployeeForm.tsx   ← 新增員工表單（Client Component）
```

## 資料表關聯圖

```
┌──────────────┐
│   Tenants    │──────────────────────────────────────────┐
│  tenant_id   │                                          │
└──────┬───────┘                                          │
       │ 1:N                                              │
       ├──────────────────┐                               │
       │                  │                               │
┌──────▼───────┐   ┌──────▼───────┐                       │
│ Departments  │   │  Job_Roles   │                       │
│   dept_id    │   │   role_id    │                       │
│ parent_dept_id│  └──────┬───────┘                       │
│  (self-ref)  │         │                                │
└──────┬───────┘         │                                │
       │                 │                                │
       │    ┌────────────┼────────────────┐               │
       │    │            │                │               │
┌──────▼────▼────────────▼───┐    ┌───────▼──────────┐    │
│      Assignments           │    │   Mentorships    │    │
│    assignment_id           │    │   relation_id    │    │
│    user_uuid ──────┐       │    │   mentor_uuid ───┼──┐ │
│    tenant_id ──────┼───────┼────┤   apprentice_uuid┼──┤ │
│    dept_id         │       │    │   tenant_id ─────┼──┼─┘
│    role_id         │       │    │   generation_level│  │
│    manager_uuid ───┤       │    │   status         │  │
│    status          │       │    └──────────────────┘  │
└────────────────────┤       │                          │
                     │       │                          │
              ┌──────▼───────▼──────────────────────────▼─┐
              │           Employees                       │
              │          user_uuid (PK)                   │
              │          name, email, phone                │
              │   (全域表，無 tenant_id，透過                │
              │    Assignments RLS 間接隔離)                │
              └───────────────────────────────────────────┘
```

## RLS (Row-Level Security) 策略

### 核心函式
```sql
current_tenant_id() → 從 JWT app_metadata.tenant_id 取得
```

### 各表策略

| 表名 | 策略 | 說明 |
|------|------|------|
| **tenants** | `tenant_id = current_tenant_id()` | 直接比對 |
| **departments** | `tenant_id = current_tenant_id()` | 直接比對 |
| **job_roles** | `tenant_id = current_tenant_id()` | 直接比對 |
| **employees** | `EXISTS(assignments WHERE tenant_id = ...)` | 間接隔離：透過 assignments 子查詢 |
| **assignments** | `tenant_id = current_tenant_id()` | 直接比對 |
| **mentorships** | `tenant_id = current_tenant_id()` | 直接比對 |

### 重要設計決策

1. **Employees 是全域表**：一個員工可隸屬多個租戶（透過不同 assignments）
2. **雙軌架構**：Assignments = 行政線 / Mentorships = 師徒線，互不干擾
3. **Mentorship.generation_level**：1=直系徒弟、2=徒孫、3=徒曾孫，用於分潤計算
4. **Middleware**：所有受保護路由經由 middleware 驗證 JWT 並確認 tenant_id 存在

## Middleware 流程

```
Request → 是否為公開路徑？
  ├─ 是 → 放行
  └─ 否 → 取得 Supabase User
           ├─ 無 User → 重導 /login
           └─ 有 User → 檢查 app_metadata.tenant_id
                        ├─ 無 → 403
                        └─ 有 → 注入 x-tenant-id header → 放行
```

## 技術棧

- **Frontend**: Next.js 14 (App Router) + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Pattern**: Feature-Sliced Design, Server Components + Server Actions
- **認證**: Supabase OTP (Magic Link)
- **租戶隔離**: JWT app_metadata + RLS Policies
