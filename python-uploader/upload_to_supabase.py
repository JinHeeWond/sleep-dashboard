"""
Kinect 자세 분류 결과(CSV)를 Supabase에 업로드하는 헬퍼.

사용 시나리오 1: 잠 끝난 후 일괄 업로드
    python upload_to_supabase.py results/20260507_posture_log.csv

사용 시나리오 2: 다른 노트북에서 실시간 업로드
    from upload_to_supabase import upload_row, upload_session
    upload_row(timestamp, posture, angle, capture_type, image_path)

환경 변수:
    SUPABASE_URL       프로젝트 URL
    SUPABASE_ANON_KEY  anon public key (대시보드와 같은 키)
    SLEEP_USER_ID      식별자 (기본값 'demo')
"""

from __future__ import annotations

import csv
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

try:
    from supabase import create_client, Client
except ImportError:
    print("[!] pip install supabase  먼저 실행하세요")
    sys.exit(1)


SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
USER_ID      = os.environ.get("SLEEP_USER_ID", "demo")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[!] 환경변수 SUPABASE_URL / SUPABASE_ANON_KEY 가 비어있습니다.")
    sys.exit(1)


def _client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ---------------------------------------------------------------------------
# 단일 행 업로드 (실시간 분류 루프에서 호출)
# ---------------------------------------------------------------------------
def upload_row(
    timestamp: int,
    posture: str,
    angle: float,
    capture_type: str,
    image_path: str | None,
) -> None:
    iso = datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()
    _client().table("posture_logs").insert({
        "user_id":      USER_ID,
        "timestamp":    int(timestamp),
        "datetime":     iso,
        "posture":      posture,
        "angle":        round(float(angle), 2),
        "capture_type": capture_type,
        "image_path":   image_path,
    }).execute()


# ---------------------------------------------------------------------------
# CSV 일괄 업로드
# ---------------------------------------------------------------------------
def upload_csv(csv_path: Path) -> int:
    rows: list[dict] = []
    with csv_path.open() as f:
        reader = csv.DictReader(f)
        for r in reader:
            ts = int(float(r["timestamp"]))
            rows.append({
                "user_id":      USER_ID,
                "timestamp":    ts,
                "datetime":     datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
                "posture":      r["posture"],
                "angle":        round(float(r.get("angle", 0)), 2),
                "capture_type": r["capture_type"],
                "image_path":   r.get("image_path") or None,
            })
    if not rows:
        print("[i] 빈 CSV — 업로드할 행 없음")
        return 0

    # 1000개씩 끊어서 insert
    sb = _client()
    BATCH = 500
    total = 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i:i + BATCH]
        sb.table("posture_logs").insert(chunk).execute()
        total += len(chunk)
        print(f"  ↑ {total}/{len(rows)}")

    return total


# ---------------------------------------------------------------------------
# 세션 요약 업로드 (잠 끝난 후 한 번)
# ---------------------------------------------------------------------------
def upload_session(
    date_str: str,                  # "YYYY-MM-DD"
    start_ts: int,
    end_ts: int,
    score: int,
    motion_count: int,
    regular_count: int,
    timelapse_url: str | None = None,
) -> None:
    payload = {
        "user_id":       USER_ID,
        "date":          date_str,
        "start_time":    datetime.fromtimestamp(start_ts, tz=timezone.utc).isoformat(),
        "end_time":      datetime.fromtimestamp(end_ts,   tz=timezone.utc).isoformat(),
        "duration_min":  max(1, (end_ts - start_ts) // 60),
        "score":         max(0, min(100, int(score))),
        "motion_count":  int(motion_count),
        "regular_count": int(regular_count),
        "timelapse_url": timelapse_url,
    }
    _client().table("sleep_sessions").upsert(
        payload, on_conflict="user_id,date"
    ).execute()


# ---------------------------------------------------------------------------
# 점수 계산 (TS와 동일 공식)
# ---------------------------------------------------------------------------
def compute_score(postures: Iterable[str], motion_count: int) -> int:
    counts = {"Supine": 0, "Lateral_L": 0, "Lateral_R": 0, "Prone": 0, "Unknown": 0}
    total = 0
    for p in postures:
        counts[p] = counts.get(p, 0) + 1
        total += 1
    total = max(1, total)
    good = (counts["Supine"] + counts["Lateral_L"] + counts["Lateral_R"]) / total
    prone_ratio = counts["Prone"] / total
    motion_penalty = min(motion_count / 30, 1) * 15
    return max(0, min(100, round(good * 80 + (1 - prone_ratio) * 20 - motion_penalty)))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python upload_to_supabase.py path/to/posture_log.csv")
        sys.exit(0)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"[!] 파일 없음: {path}")
        sys.exit(1)

    n = upload_csv(path)
    print(f"[OK] {n}개 행 업로드 완료")

    # 같은 CSV로 세션 요약도 같이 만들어 올리기
    with path.open() as f:
        rows = list(csv.DictReader(f))
    if rows:
        ts0 = int(float(rows[0]["timestamp"]))
        ts1 = int(float(rows[-1]["timestamp"]))
        date_str = datetime.fromtimestamp(ts0).strftime("%Y-%m-%d")
        motion = sum(1 for r in rows if r["capture_type"] == "motion")
        regular = sum(1 for r in rows if r["capture_type"] == "regular")
        score = compute_score((r["posture"] for r in rows), motion)
        upload_session(date_str, ts0, ts1, score, motion, regular)
        print(f"[OK] {date_str} 세션 요약 업로드 (점수 {score})")
