import type { Posture, PostureLog, SleepSession } from "./types";

const POSTURES: Posture[] = ["Supine", "Lateral_L", "Lateral_R", "Prone"];

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function fmtDateTime(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Generate a realistic posture log for one night, anchored to a date string (YYYY-MM-DD)
export function mockPostureLogs(dateStr: string): PostureLog[] {
  const seed = Number(dateStr.replace(/-/g, ""));
  const rnd = seedRandom(seed);

  // sleep starts the night before at 23:30, ends at 07:00
  const start = new Date(`${dateStr}T07:00:00`);
  start.setHours(start.getHours() - 7); // back to ~00:00
  start.setMinutes(start.getMinutes() - 30); // ~23:30 prev day

  const logs: PostureLog[] = [];
  const totalMinutes = 7 * 60 + 30;
  let currentPosture: Posture = "Supine";
  let posCounter = 0;

  for (let m = 0; m < totalMinutes; m += 1) {
    const t = new Date(start.getTime() + m * 60_000);
    const ts = Math.floor(t.getTime() / 1000);

    // Posture changes every ~25-50 minutes
    posCounter += 1;
    if (posCounter >= 25 + Math.floor(rnd() * 25)) {
      const weights: Record<Posture, number> = {
        Supine: 0.35,
        Lateral_L: 0.25,
        Lateral_R: 0.3,
        Prone: 0.08,
        Unknown: 0.02,
      };
      const r = rnd();
      let acc = 0;
      for (const p of POSTURES) {
        acc += weights[p];
        if (r < acc) {
          currentPosture = p;
          break;
        }
      }
      posCounter = 0;

      // motion event at posture change
      logs.push({
        timestamp: ts,
        datetime: fmtDateTime(t),
        posture: currentPosture,
        angle: Math.round((rnd() * 90) * 100) / 100,
        capture_type: "motion",
        image_path: `dummy_${ts}_motion.png`,
      });
    }

    // regular capture every minute
    if (m % 1 === 0) {
      logs.push({
        timestamp: ts,
        datetime: fmtDateTime(t),
        posture: currentPosture,
        angle: Math.round((rnd() * 90) * 100) / 100,
        capture_type: "regular",
        image_path: `dummy_${ts}_regular.png`,
      });
    }
  }
  return logs;
}

export function summarizeLogs(logs: PostureLog[]) {
  const counts: Record<Posture, number> = {
    Supine: 0,
    Lateral_L: 0,
    Lateral_R: 0,
    Prone: 0,
    Unknown: 0,
  };
  let motion = 0;
  let regular = 0;
  for (const l of logs) {
    counts[l.posture] += 1;
    if (l.capture_type === "motion") motion += 1;
    else regular += 1;
  }
  const total = logs.length || 1;
  const distribution = (Object.keys(counts) as Posture[]).map((p) => ({
    posture: p,
    count: counts[p],
    pct: Math.round((counts[p] / total) * 1000) / 10,
  }));
  return { counts, distribution, motion, regular, total };
}

export function mockSession(dateStr: string): SleepSession {
  const logs = mockPostureLogs(dateStr);
  const { motion, regular } = summarizeLogs(logs);
  const start = new Date(logs[0].timestamp * 1000).toISOString();
  const end = new Date(logs[logs.length - 1].timestamp * 1000).toISOString();
  return {
    date: dateStr,
    start_time: start,
    end_time: end,
    duration_min: Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 60_000
    ),
    motion_count: motion,
    regular_count: regular,
  };
}

export function mockHistory(days = 14): SleepSession[] {
  const sessions: SleepSession[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    sessions.push(mockSession(fmtDate(d)));
  }
  return sessions;
}

export function todayStr(): string {
  return fmtDate(new Date());
}
