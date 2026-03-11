/** Auth 路由群組：登入 / Onboarding（無側邊欄） */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-dark">
      {children}
    </div>
  );
}
