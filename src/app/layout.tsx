import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "愛窩集團 HR 管理系統",
  description: "多租戶人事與組織權限管理平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-surface-dark">
            <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-sm font-bold">
                A
              </div>
              <span className="text-lg font-semibold tracking-tight">
                愛窩 HR
              </span>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              <NavLink href="/dashboard" label="儀表板" icon="grid" />
              <NavLink href="/employees/new" label="新增員工" icon="plus" />
            </nav>
          </aside>

          {/* Main */}
          <main className="ml-64 flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const icons: Record<string, string> = {
    grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
    plus: "M12 4v16m8-8H4",
  };
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon]} />
      </svg>
      {label}
    </a>
  );
}
