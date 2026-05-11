"""
Kinect 자세 분류 결과(CSV)를 Supabase의 posture_log 테이블에 업로드하는 헬퍼.

⚠️ 이 스크립트는 dev/테스트 보조 도구입니다.
   실제 운영용 코드는 백엔드 레포(HCI_Project_SleepPostureAnalysis)의
   backend/utils/db.py 를 참고하세요.

사용 시나리오 1: 잠 끝난 후 일괄 업로드
    python upload_to_supabase.py results/20260507_posture_log.csv

사용 시나리오 2: 다른 노트북에서 실시간 업로드
    from upload_to_supabase import upload_row
    upload_row(timestamp, posture, angle, capture_type, image_path)

환경 변수:
    SUPABASE_URL       프로젝트 URL
    SUPABASE_ANON_KEY  anon public key
    SLEEP_USER_ID      ⚠️ 본인 Supabase Auth UUID
                       (대시보드 → Authentication → Users → 본인 행 ID)
                       이 값을 안 넣으면 dashboard에 데이터가 안 보입니다.
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
USER_ID      = os.environ.get("SLEEP_USER_ID", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[!] 환경변수 SUPABASE_URL / SUPABASE_ANON_KEY 가 비어있습니다.")
    sys.exit(1)

if not USER_ID:
    print("[!] 환경변수 SLEEP_USER_ID 가 비어있습니다.")
    print("    Supabase 대시보드 → Authentication → Users 에서 본인 UUID를 복사해")
    print("    export SLEEP_USER_ID=<uuid> 로 설정하세요.")
    sys.exit(1)


TABLE = "posture_log"   # 백엔드 레포와 동일하게 단수형


def _client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_row(
    timestamp: int,
    posture: str,
    angle: float,
    capture_type: str,
    image_path: str | None,
) -> None:
    iso = datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()
    _client().table(TABLE).insert({
        "user_id":      USER_ID,
        "timestamp":    int(timestamp),
        "datetime":     iso,
        "posture":      posture,
        "angle":        round(float(angle), 2),
        "capture_type": capture_type,
        "image_path":   image_path,
    }).execute()


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

    sb = _client()
    BATCH = 500
    total = 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i:i + BATCH]
        sb.table(TABLE).insert(chunk).execute()
        total += len(chunk)
        print(f"  ↑ {total}/{len(rows)}")

    return total


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python upload_to_supabase.py path/to/posture_log.csv")
        sys.exit(0)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"[!] 파일 없음: {path}")
        sys.exit(1)

    n = upload_csv(path)
    print(f"[OK] {n}개 행 업로드 완료 (user_id={USER_ID})")
