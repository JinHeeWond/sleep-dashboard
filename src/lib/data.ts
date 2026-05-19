// Single source of truth for fetching sleep data from Supabase.
// Returns empty results when no data exists - UI is responsible for
// rendering empty state.

import { createClient, isSupabaseConfigured } from "./supabase/server";
import type {
  MorningCondition,
  Posture,
  PostureLog,
  SleepSession,
} from "./types";

export type PostureDistEntry = { posture: Posture; count: number; pct: number };

const TABLE_POSTURE = "posture_log";
const TABLE_CONDITION = "morning_conditions";

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function aggregateSession(date: string, logs: PostureLog[]): SleepSession {
  if (logs.length === 0) {
    const iso = new Date(`${date}T00:00:00`).toISOString();
    return {
      date,
      start_time: iso,
      end_time: iso,
      duration_min: 0,
      motion_count: 0,
      regular_count: 0,
    };
  }
  const first = logs[0];
  const last = logs[logs.length - 1];
  let motion = 0;
  let regular = 0;
  for (const l of logs) {
    if (l.capture_type === "motion") motion += 1;
    else regular += 1;
  }
  const start = new Date(first.timestamp * 1000);
  const end = new Date(last.timestamp * 1000);
  return {
    date,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    duration_min: Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / 60_000)
    ),
    motion_count: motion,
    regular_count: regular,
  };
}

export async function fetchPostureLogs(
  date: string,
  userId: string
): Promise<PostureLog[]> {
  const sb = await createClient();
  if (!sb) return [];
  const { data } = await sb
    .from(TABLE_POSTURE)
    .select("*")
    .eq("user_id", userId)
    .gte("datetime", `${date} 00:00:00`)
    .lte("datetime", `${date} 23:59:59`)
    .order("timestamp", { ascending: true });
  return (data as PostureLog[] | null) ?? [];
}

export async function fetchSession(
  date: string,
  userId: string
): Promise<SleepSession> {
  const sb = await createClient();
  if (!sb) return aggregateSession(date, []);
  const { data } = await sb
    .from(TABLE_POSTURE)
    .select("timestamp,datetime,capture_type")
    .eq("user_id", userId)
    .gte("datetime", `${date} 00:00:00`)
    .lte("datetime", `${date} 23:59:59`)
    .order("timestamp", { ascending: true });
  return aggregateSession(date, (data as PostureLog[] | null) ?? []);
}

export async function fetchHistory(
  userId: string,
  days = 14
): Promise<SleepSession[]> {
  const sb = await createClient();
  if (!sb) return [];

  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);

  const { data } = await sb
    .from(TABLE_POSTURE)
    .select("timestamp,datetime,capture_type")
    .eq("user_id", userId)
    .gte("datetime", `${startStr} 00:00:00`)
    .order("timestamp", { ascending: true });

  if (!data || data.length === 0) return [];

  const byDate = new Map<string, PostureLog[]>();
  for (const row of data as PostureLog[]) {
    const day = row.datetime.slice(0, 10);
    if (!byDate.has(day)) byDate.set(day, []);
    byDate.get(day)!.push(row);
  }

  const sessions: SleepSession[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.toISOString().slice(0, 10);
    const dayLogs = byDate.get(day);
    if (dayLogs && dayLogs.length > 0) {
      sessions.push(aggregateSession(day, dayLogs));
    }
  }
  return sessions;
}

export async function fetchMorningCondition(
  date: string,
  userId: string
): Promise<MorningCondition | null> {
  const sb = await createClient();
  if (!sb) return null;
  const { data } = await sb
    .from(TABLE_CONDITION)
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  return (data as MorningCondition | null) ?? null;
}

export async function fetchMorningConditions(
  userId: string,
  days = 14
): Promise<Record<string, MorningCondition>> {
  const sb = await createClient();
  if (!sb) return {};

  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);

  const { data } = await sb
    .from(TABLE_CONDITION)
    .select("*")
    .eq("user_id", userId)
    .gte("date", startStr);

  const out: Record<string, MorningCondition> = {};
  for (const row of (data as MorningCondition[] | null) ?? []) {
    out[row.date] = row;
  }
  return out;
}

export async function fetchPostureDistributionRange(
  userId: string,
  days = 14
): Promise<PostureDistEntry[]> {
  const sb = await createClient();
  if (!sb) return [];

  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);

  const { data } = await sb
    .from(TABLE_POSTURE)
    .select("posture")
    .eq("user_id", userId)
    .gte("datetime", `${startStr} 00:00:00`);

  const rows = (data as { posture: Posture }[] | null) ?? [];
  if (rows.length === 0) return [];

  const counts: Record<Posture, number> = {
    Supine: 0,
    Prone: 0,
    Lateral_L: 0,
    Lateral_R: 0,
    Unknown: 0,
  };
  for (const r of rows) {
    counts[r.posture] = (counts[r.posture] ?? 0) + 1;
  }
  const total = rows.length;
  return (Object.entries(counts) as [Posture, number][])
    .filter(([, c]) => c > 0)
    .map(([posture, count]) => ({
      posture,
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchTimelapse(
  date: string,
  userId: string
): Promise<{ url: string; duration_sec: number; frame_count: number } | null> {
  const sb = await createClient();
  if (!sb) return null;
  const { data } = await sb
    .from("timelapse_videos")
    .select("url,duration_sec,frame_count")
    .eq("user_id", userId)
    .eq("date", date)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export { isSupabaseConfigured };
