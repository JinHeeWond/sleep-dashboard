import type { Metadata } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/layout-shell";

export const metadata: Metadata = {
  title: "SleepLab · AI 수면 자세 분석",
  description: "Azure Kinect 기반 수면 자세 분석 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full text-foreground selection:bg-primary/30 selection:text-foreground">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
