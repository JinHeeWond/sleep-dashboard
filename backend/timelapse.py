"""
SleepLab — 타임랩스 생성 스크립트
====================================
수면 중 촬영된 이미지로 타임랩스 MP4를 만들고 Supabase에 업로드합니다.
업로드된 URL은 timelapse_videos 테이블에 저장되어 웹 분석 페이지에 표시됩니다.

실행:
    cd sleep-dashboard/backend
    python timelapse.py              # 어제 날짜 (수면 후 아침에 실행)
    python timelapse.py 2026-05-13  # 특정 날짜 지정
"""

import cv2
import sys
import numpy as np
import requests
import imageio.v3 as iio
from datetime import datetime, date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from utils.db import fetch_posture_by_date, upload_timelapse, save_timelapse

# ── 설정 ─────────────────────────────────────────────
TIMELAPSE_FPS  = 10
OUTPUT_WIDTH   = 1280
OUTPUT_HEIGHT  = 720
TIMELAPSE_DIR  = Path(__file__).parent / "timelapse"

LABEL_STYLE = {
    "regular": {"text": "정기 촬영",   "color": (100, 220, 100)},
    "motion":  {"text": "움직임 감지", "color": (80,  80,  255)},
}


def read_image(url_or_path: str) -> "np.ndarray | None":
    """Storage URL 또는 로컬 경로에서 이미지 읽기."""
    if url_or_path.startswith("http"):
        try:
            resp = requests.get(url_or_path, timeout=15)
            if resp.status_code == 200:
                arr = np.frombuffer(resp.content, np.uint8)
                return cv2.imdecode(arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"  [다운로드 실패] {e}")
        return None
    # 로컬 경로: np.fromfile로 한글 경로 지원
    try:
        arr = np.fromfile(url_or_path, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception:
        return None


def add_overlay(frame: "np.ndarray", timestamp: int, label: str,
                idx: int, total: int) -> "np.ndarray":
    """프레임에 시각, 라벨, 진행 바 오버레이 추가."""
    out  = frame.copy()
    h, w = out.shape[:2]

    # 상단 반투명 바
    bar = out.copy()
    cv2.rectangle(bar, (0, 0), (w, 50), (0, 0, 0), -1)
    cv2.addWeighted(bar, 0.5, out, 0.5, 0, out)

    dt_str = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d  %H:%M:%S")
    cv2.putText(out, dt_str, (12, 32),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)

    style = LABEL_STYLE.get(label, {"text": label, "color": (200, 200, 200)})
    cv2.putText(out, style["text"], (w - 200, 32),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, style["color"], 2)

    # 하단 진행 바
    progress_w = int((idx / max(total - 1, 1)) * w)
    cv2.rectangle(out, (0, h - 8), (w, h), (50, 50, 50), -1)
    cv2.rectangle(out, (0, h - 8), (progress_w, h), (80, 200, 120), -1)

    return out


def create_and_upload(target_date: str) -> str | None:
    """타임랩스를 생성하고 Supabase에 업로드 후 공개 URL 반환."""
    TIMELAPSE_DIR.mkdir(parents=True, exist_ok=True)

    # Supabase에서 해당 날짜 프레임 목록 로드
    rows   = fetch_posture_by_date(target_date)
    frames = [r for r in rows if r.get("image_path")]

    if not frames:
        print(f"[오류] {target_date} 날짜의 이미지 데이터가 없습니다.")
        print("  posture_log의 image_path 컬럼이 채워져 있는지 확인하세요.")
        return None

    print(f"프레임 수: {len(frames)}장")
    start_dt = datetime.fromtimestamp(frames[0]["timestamp"])
    end_dt   = datetime.fromtimestamp(frames[-1]["timestamp"])
    print(f"수면 구간: {start_dt.strftime('%H:%M')} ~ {end_dt.strftime('%H:%M')}")

    output_path = TIMELAPSE_DIR / f"{target_date.replace('-', '')}_timelapse.mp4"

    print(f"\n타임랩스 생성 중…")
    frame_list = []
    for i, row in enumerate(frames):
        img = read_image(row["image_path"])
        if img is None:
            continue
        img = cv2.resize(img, (OUTPUT_WIDTH, OUTPUT_HEIGHT))
        img = add_overlay(img, row["timestamp"], row["capture_type"], i, len(frames))
        frame_list.append(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        if (i + 1) % 10 == 0 or i == len(frames) - 1:
            print(f"  {i + 1}/{len(frames)} ({(i + 1) / len(frames) * 100:.0f}%)")

    written = len(frame_list)
    if written == 0:
        print("[오류] 유효한 이미지를 하나도 읽지 못했습니다. image_path를 확인하세요.")
        return None

    iio.imwrite(
        str(output_path),
        np.stack(frame_list),
        extension=".mp4",
        plugin="pyav",
        codec="h264",
        fps=TIMELAPSE_FPS,
    )

    file_mb  = output_path.stat().st_size / 1024 / 1024
    duration = written / TIMELAPSE_FPS
    print(f"\n[완료] {output_path.name} — {file_mb:.1f}MB / {duration:.1f}초 ({written}프레임)")

    # Supabase Storage 업로드
    print("\nSupabase Storage 업로드 중…")
    url = upload_timelapse(str(output_path), target_date)
    save_timelapse(target_date, url, duration, written)
    print(f"웹 분석 페이지({target_date})에서 확인하세요.")
    return url


if __name__ == "__main__":
    # 인자 없으면 어제 날짜 (수면 후 아침에 실행하는 용도)
    if len(sys.argv) > 1:
        target = sys.argv[1]
    else:
        target = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")

    print("=" * 50)
    print(f" SleepLab 타임랩스 생성")
    print(f" 날짜: {target}")
    print("=" * 50 + "\n")

    create_and_upload(target)
