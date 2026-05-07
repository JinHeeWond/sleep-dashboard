import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/sidebar";

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
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 pb-20 md:pb-0">
            <div className="mx-auto max-w-6xl px-5 md:px-10 py-8 md:py-12">
              {children}
            </div>
          </main>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
