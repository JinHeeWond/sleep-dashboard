// Single source of truth for fetching sleep data.
// Tries Supabase first, falls back to mock generator. Swap is transparent
// to UI components - once Kinect+Python pushes posture_logs to Supabase
// the same components render real data.

import { getSupabase, isSupabaseConfigured } from "./supabase";
import {
  mockCondition,
  mockHistory,
  mockPostureLogs,
  mockSession,
  todayStr,
} from "./mock-data";
import type { MorningCondition, PostureLog, SleepSession } from "./types";

export async function fetchPostureLogs(date: string): Promise<PostureLog[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("posture_logs")
      .select("*")
      .gte("datetime", `${date} 00:00:00`)
      .lte("datetime", `${date} 23:59:59`)
      .order("timestamp", { ascending: true });
    if (!error && data && data.length > 0) return data as PostureLog[];
  }
  return mockPostureLogs(date);
}

export async function fetchSession(date: string): Promise<SleepSession> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb
      .from("sleep_sessions")
      .select("*")
      .eq("date", date)
      .maybeSingle();
    if (data) return data as SleepSession;
  }
  return mockSession(date);
}

export async function fetchHistory(days = 14): Promise<SleepSession[]> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb
      .from("sleep_sessions")
      .select("*")
      .order("date", { ascending: false })
      .limit(days);
    if (data && data.length > 0) return (data as SleepSession[]).reverse();
  }
  return mockHistory(days);
}

export async function fetchCondition(date: string): Promise<MorningCondition | null> {
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb
      .from("morning_conditions")
      .select("*")
      .eq("date", date)
      .maybeSingle();
    if (data) return data as MorningCondition;
  }
  return mockCondition(date);
}

export async function saveCondition(
  c: MorningCondition
): Promise<{ ok: boolean; via: "supabase" | "local"; error?: string }> {
  const sb = getSupabase();
  if (sb) {
    const payload = { ...c, user_id: c.user_id ?? "demo" };
    const { error } = await sb
      .from("morning_conditions")
      .upsert(payload, { onConflict: "user_id,date" });
    if (error) {
      console.error("[supabase] upsert failed:", error);
      return { ok: false, via: "supabase", error: error.message };
    }
    return { ok: true, via: "supabase" };
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(`condition:${c.date}`, JSON.stringify(c));
  }
  return { ok: true, via: "local" };
}

export { todayStr };
export { isSupabaseConfigured };
