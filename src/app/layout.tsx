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
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
