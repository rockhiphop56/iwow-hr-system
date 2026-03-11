import { getUserPermissions } from "@/lib/permissions";

/** App 路由群組：含側邊欄 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let permissions: string[] = [];
  try {
    const perms = await getUserPermissions();
    permissions = perms.permissions;
  } catch {
    // 未登入或權限查詢失敗，顯示最基本導航
  }

  const hasSettings = permissions.some((p) => p.startsWith("settings."));
  const hasSystem = permissions.some((p) => p.startsWith("system."));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-surface-dark">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold">
            i
          </div>
          <span className="text-lg font-semibold tracking-tight">
            愛窩 HR
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <NavLink href="/dashboard" label="儀表板" icon="grid" />
          <NavLink href="/employees/new" label="新增員工" icon="plus" />

          <SectionLabel label="組織管理" />
          <NavLink href="/org-chart" label="行政組織圖" icon="sitemap" />
          <NavLink href="/mentorship-tree" label="師徒組織圖" icon="users" />

          <SectionLabel label="簽核中心" />
          <NavLink href="/approvals" label="簽核作業" icon="clipboard" />

          {hasSettings && (
            <>
              <SectionLabel label="參數設定" />
              <NavLink href="/settings/tenants" label="公司/分店管理" icon="building" />
              <NavLink href="/settings/job-roles" label="職務管理" icon="briefcase" />
              <NavLink href="/settings/job-grades" label="職等管理" icon="chart" />
              <NavLink href="/settings/employment-types" label="僱用類型" icon="tag" />
              <NavLink href="/settings/job-deputies" label="職務代理人" icon="swap" />
            </>
          )}

          {hasSystem && (
            <>
              <SectionLabel label="系統管理" />
              <NavLink href="/settings/roles" label="角色與權限" icon="shield" />
              <NavLink href="/settings/approval-types" label="簽核類型設定" icon="flow" />
            </>
          )}
        </nav>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
      {label}
    </div>
  );
}

const ICONS: Record<string, string> = {
  grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  plus: "M12 4v16m8-8H4",
  sitemap: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
  users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  briefcase: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  tag: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  swap: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  flow: "M4 6h16M4 10h16M4 14h16M4 18h16",
};

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      <svg
        className="h-4 w-4 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={ICONS[icon] ?? ICONS.grid}
        />
      </svg>
      {label}
    </a>
  );
}
