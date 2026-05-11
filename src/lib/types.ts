// Matches Python posture_log CSV schema exactly so Kinect side can write directly.
export type Posture = "Supine" | "Prone" | "Lateral_L" | "Lateral_R" | "Unknown";

export type CaptureType = "regular" | "motion";

export interface PostureLog {
  id?: string;
  user_id?: string;
  timestamp: number;            // unix seconds
  datetime: string;             // "YYYY-MM-DD HH:MM:SS"
  posture: Posture;
  angle: number;                // 0-90, confidence-ish
  capture_type: CaptureType;
  image_path: string | null;
}

// Derived view (not a DB table) — aggregated from posture_log on the fly.
export interface SleepSession {
  date: string;                 // "YYYY-MM-DD"
  start_time: string;           // ISO
  end_time: string;             // ISO
  duration_min: number;
  motion_count: number;
  regular_count: number;
}

export interface MorningCondition {
  id?: number;
  user_id?: string;
  date: string;                 // "YYYY-MM-DD"
  refreshment: number | null;   // 1 (worst) ~ 5 (best)
  pain_neck: boolean;
  pain_shoulder: boolean;
  pain_back: boolean;
  memo?: string | null;
}

export const POSTURE_KO: Record<Posture, string> = {
  Supine: "똑바로 (앙와위)",
  Prone: "엎드려 (복와위)",
  Lateral_L: "왼쪽 (좌측와위)",
  Lateral_R: "오른쪽 (우측와위)",
  Unknown: "미분류",
};

export const POSTURE_COLOR: Record<Posture, string> = {
  Supine: "#5BBF72",
  Lateral_L: "#F4A742",
  Lateral_R: "#E07BB5",
  Prone: "#5B8EBF",
  Unknown: "#AAAAAA",
};

export const POSTURE_DESC: Record<Posture, string> = {
  Supine: "천장을 보고 똑바로 누운 자세. 척추 정렬에 좋지만 코골이가 심해질 수 있습니다.",
  Prone: "엎드려 누운 자세. 목과 허리에 부담을 줄 수 있어 권장되지 않습니다.",
  Lateral_L: "왼쪽으로 누운 자세. 소화에 도움이 되며 코골이를 줄여줍니다.",
  Lateral_R: "오른쪽으로 누운 자세. 심장 부담이 적고 편안한 자세입니다.",
  Unknown: "자세 판정이 불가능합니다.",
};
