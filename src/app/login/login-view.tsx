"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Lock, Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { LanguageToggle } from "@/components/language-toggle";
import { useLang, type Lang } from "@/lib/lang";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";

type Mode = "signin" | "signup";

const COPY: Record<Lang, {
  badge: string;
  title: (mode: Mode) => string;
  sub: (mode: Mode) => string;
  tabSignIn: string;
  tabSignUp: string;
  email: string;
  emailPh: string;
  password: string;
  passwordPh: string;
  submit: (mode: Mode) => string;
  busy: (mode: Mode) => string;
  back: string;
  privacy: string;
  errors: Record<string, string>;
}> = {
  ko: {
    badge: "SleepLab",
    title: (m) =>
      m === "signin" ? "다시 만나서 반가워요" : "처음 오셨어요?\n수면 분석을 시작해요",
    sub: (m) =>
      m === "signin"
        ? "이메일과 비밀번호로 로그인해주세요."
        : "이메일과 비밀번호로 계정을 만들면 바로 시작할 수 있어요.",
    tabSignIn: "로그인",
    tabSignUp: "회원가입",
    email: "이메일",
    emailPh: "you@example.com",
    password: "비밀번호",
    passwordPh: "6자 이상",
    submit: (m) => (m === "signin" ? "로그인" : "계정 만들기"),
    busy: (m) => (m === "signin" ? "로그인 중…" : "계정 만드는 중…"),
    back: "← 홈으로",
    privacy: "데이터는 본인 계정에만 저장됩니다.",
    errors: {
      invalid_email: "이메일 형식이 올바르지 않아요.",
      weak_password: "비밀번호는 6자 이상이어야 해요.",
      "Invalid login credentials": "이메일 또는 비밀번호가 일치하지 않아요.",
      "User already registered": "이미 가입된 이메일이에요. 로그인 해주세요.",
      "Email not confirmed": "이메일 인증이 필요해요. 관리자에게 문의하거나 Supabase에서 Confirm email을 꺼주세요.",
    },
  },
  en: {
    badge: "SleepLab",
    title: (m) =>
      m === "signin" ? "Welcome back" : "First time here?\nStart tracking sleep",
    sub: (m) =>
      m === "signin"
        ? "Sign in with your email and password."
        : "Create an account with email and password.",
    tabSignIn: "Sign in",
    tabSignUp: "Sign up",
    email: "Email",
    emailPh: "you@example.com",
    password: "Password",
    passwordPh: "6+ characters",
    submit: (m) => (m === "signin" ? "Sign in" : "Create account"),
    busy: (m) => (m === "signin" ? "Signing in…" : "Creating account…"),
    back: "← Home",
    privacy: "Your data is scoped to your account only.",
    errors: {
      invalid_email: "Email format is invalid.",
      weak_password: "Password must be at least 6 characters.",
      "Invalid login credentials": "Wrong email or password.",
      "User already registered": "This email is already registered. Sign in instead.",
      "Email not confirmed": "Email confirmation required. Turn off Confirm email in Supabase or ask the admin.",
    },
  },
};

const initialState: AuthState = { error: null };

export function LoginView() {
  const { lang } = useLang();
  const t = COPY[lang];
  const [mode, setMode] = useState<Mode>("signin");

  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  const errorMsg = state.error
    ? t.errors[state.error] ?? state.error
    : null;

  return (
    <div className="min-h-screen grid place-items-center px-6 py-12 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] bg-primary/20 blur-[160px] rounded-full pointer-events-none"
      />
      <div className="absolute top-5 right-5">
        <LanguageToggle />
      </div>

      <div className="relative w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
          <span className="relative grid place-items-center size-11 rounded-2xl bg-gradient-to-br from-primary to-primary-2 shadow-[0_10px_30px_-10px_rgba(139,92,246,0.7)]">
            <Moon className="size-5 text-white" />
            <Sparkles className="size-2.5 text-accent absolute -top-0.5 -right-0.5 animate-pulse-soft" />
          </span>
          <span className="text-lg font-extrabold tracking-tight gradient-text">
            {t.badge}
          </span>
        </Link>

        <div className="inline-flex p-1 rounded-full border border-white/10 bg-white/5 mb-8 backdrop-blur">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                mode === m
                  ? "bg-gradient-to-r from-primary to-primary-2 text-white shadow-[0_6px_20px_-8px_rgba(139,92,246,0.6)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "signin" ? t.tabSignIn : t.tabSignUp}
            </button>
          ))}
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.1] mb-3 text-foreground whitespace-pre-line">
          {t.title(mode)}
        </h1>
        <p className="text-sm text-foreground-soft/80 mb-8 leading-relaxed">
          {t.sub(mode)}
        </p>

        <form action={formAction} className="space-y-4" key={mode}>
          <Field
            icon={<Mail className="size-4 text-muted-foreground" />}
            name="email"
            type="email"
            label={t.email}
            placeholder={t.emailPh}
            autoComplete="email"
            required
          />
          <Field
            icon={<Lock className="size-4 text-muted-foreground" />}
            name="password"
            type="password"
            label={t.password}
            placeholder={t.passwordPh}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
          />

          {errorMsg && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <Button
            type="submit"
            disabled={pending}
            size="lg"
            className="w-full"
          >
            {pending ? t.busy(mode) : t.submit(mode)}
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground/70 leading-relaxed">
          {t.privacy}
        </p>

        <Link
          href="/"
          className="inline-block mt-10 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          {t.back}
        </Link>
      </div>
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  label: string;
};

function Field({ icon, label, ...props }: FieldProps) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
        {label}
      </span>
      <div className="mt-1.5 relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</span>
        <input
          {...props}
          className="w-full h-12 pl-10 pr-4 rounded-2xl border border-white/10 bg-white/5 text-sm text-foreground placeholder:text-muted-foreground/60 backdrop-blur focus:outline-none focus:border-primary-3/50 focus:bg-white/8 transition-colors"
        />
      </div>
    </label>
  );
}
