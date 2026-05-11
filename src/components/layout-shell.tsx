"use client";

import { usePathname } from "next/navigation";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { LanguageProvider } from "@/lib/lang";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <LanguageProvider>
      {isLanding ? (
        <main className="min-h-screen">{children}</main>
      ) : (
        <>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 pb-24 md:pb-0">
              <div className="mx-auto max-w-6xl px-5 md:px-10 py-10 md:py-14">
                {children}
              </div>
            </main>
          </div>
          <MobileNav />
        </>
      )}
    </LanguageProvider>
  );
}
