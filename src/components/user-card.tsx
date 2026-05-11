"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/auth/actions";
import { useLang, type Lang } from "@/lib/lang";

type UserInfo = {
  name: string;
  email: string;
  avatarUrl?: string;
};

const COPY: Record<Lang, { signOut: string; signingOut: string }> = {
  ko: { signOut: "로그아웃", signingOut: "로그아웃 중…" },
  en: { signOut: "Sign out", signingOut: "Signing out…" },
};

export function UserCard() {
  const { lang } = useLang();
  const t = COPY[lang];
  const [user, setUser] = useState<UserInfo | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!alive || !data.user) return;
      const meta = data.user.user_metadata ?? {};
      setUser({
        name: meta.full_name ?? meta.name ?? data.user.email?.split("@")[0] ?? "User",
        email: data.user.email ?? "",
        avatarUrl: meta.avatar_url ?? meta.picture,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (!session?.user) {
        setUser(null);
        return;
      }
      const meta = session.user.user_metadata ?? {};
      setUser({
        name: meta.full_name ?? meta.name ?? session.user.email?.split("@")[0] ?? "User",
        email: session.user.email ?? "",
        avatarUrl: meta.avatar_url ?? meta.picture,
      });
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!user) return null;

  return (
    <form
      action={async () => {
        setPending(true);
        await signOut();
      }}
      className="relative overflow-hidden rounded-3xl p-4 border border-white/10 bg-gradient-to-br from-[#2a1d6e]/60 via-[#1a1645]/60 to-[#0d0a2c]/60"
    >
      <div className="flex items-center gap-3 mb-3">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="size-9 rounded-full border border-white/15 object-cover"
          />
        ) : (
          <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary-2 grid place-items-center text-white text-sm font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs font-semibold text-foreground truncate">
            {user.name}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {user.email}
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-xs text-foreground-soft hover:bg-white/5 hover:text-foreground transition-colors disabled:opacity-50"
      >
        <LogOut className="size-3.5" />
        {pending ? t.signingOut : t.signOut}
      </button>
    </form>
  );
}
