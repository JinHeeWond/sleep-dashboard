"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { LanguageProvider, useLang } from "@/lib/lang";

function MobileTopBar() {
  const router = useRouter();
  const { lang } = useLang();
  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center h-12 px-3 bg-background/85 backdrop-blur-lg border-b border-white/5">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-foreground-soft hover:bg-white/5 active:bg-white/10 transition-colors"
        aria-label={lang === "ko" ? "뒤로 가기" : "Go back"}
      >
        <ArrowLeft className="size-4" />
        <span className="font-medium">{lang === "ko" ? "뒤로" : "Back"}</span>
      </button>
    </header>
  );
}

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
              <MobileTopBar />
              <div className="mx-auto max-w-6xl px-5 md:px-10 py-6 md:py-14">
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
