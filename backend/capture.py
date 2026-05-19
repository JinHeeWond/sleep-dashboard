"""
SleepLab — 수면 캡처 서비스
============================
실행:
    cd sleep-dashboard/backend
    python capture.py
"""

import os
import cv2
import sys
import time

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")   # TF 노이즈 로그 억제
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from utils.db import get_client, _user_id, insert_posture, fetch_capture_settings
from classifier import PostureClassifier
from camera_loop import CaptureSettings, run as run_loop
import stream

# ── 설정 ─────────────────────────────────────────────
STREAM_PORT    = 8765
TABLE_SESSIONS = "recording_sessions"
SAVE_DIR = Path(__file__).parent / "sleep_frames" / datetime.now().strftime("%Y%m%d")
SAVE_DIR.mkdir(parents=True, exist_ok=True)

MAX_RETRIES  = 5   # 크래시 후 자동 재시작 최대 횟수
RETRY_DELAY  = 5   # 첫 재시작 대기 (초, 이후 2배씩 증가)

# Kinect 감지
try:
    import pykinect_azure as pykinect
    KINECT_AVAILABLE = True
    print("[OK] Kinect 사용 가능")
except ImportError:
    KINECT_AVAILABLE = False
    print("[웹캠 모드] Kinect 없음 → 웹캠으로 대체")


# ── Supabase 연동 ─────────────────────────────────────

_last_status = "idle"

def get_status() -> str:
    global _last_status
    try:
        r = (get_client()
             .table(TABLE_SESSIONS)
             .select("status")
             .eq("user_id", _user_id())
             .limit(1)
             .execute())
        new = r.data[0]["status"] if r.data else _last_status
        if new != _last_status:
            print(f"\n[상태] {_last_status} → {new}")
        _last_status = new
    except Exception as e:
        print(f"\n  [상태 조회 실패] {e}")
    return _last_status


def reset_session() -> None:
    """시작 시 세션을 idle로 초기화 — 웹 버튼을 눌러야만 촬영 시작."""
    try:
        get_client().table(TABLE_SESSIONS).upsert(
            {"user_id": _user_id(), "status": "idle",
             "updated_at": datetime.now().isoformat()},
            on_conflict="user_id",
        ).execute()
        print("[세션] idle 초기화 완료 — 웹에서 '기록 시작'을 눌러주세요")
    except Exception as e:
        print(f"[세션] 초기화 실패: {e}")


def upload(ts: int, image_path: str, kind: str, posture: str) -> None:
    try:
        insert_posture(
            timestamp=ts, posture=posture, angle=0,
            capture_type=kind, image_path=image_path, upload=True,
        )
        print(f"  ✅ {kind} 업로드 (자세: {posture})")
    except Exception as e:
        print(f"  ❌ 업로드 실패: {e}")


def _load_settings() -> CaptureSettings:
    defaults = CaptureSettings()
    try:
        s = fetch_capture_settings()
        cfg = CaptureSettings(
            interval_sec    = 10, # int(s.get("interval_sec",    defaults.interval_sec)),
            motion_thr      = 12, # int(s.get("motion_thr",      defaults.motion_thr)),
            motion_cooldown = 10, # int(s.get("motion_cooldown", defaults.motion_cooldown)),
        )
        print(f"[설정] 촬영간격={cfg.interval_sec}s  움직임임계={cfg.motion_thr}  움직임간격={cfg.motion_cooldown}s")
        return cfg
    except Exception as e:
        print(f"[설정] 로드 실패, 기본값 사용: {e}")
        return defaults


# ── 프레임 소스 제너레이터 ───────────────────────────

def _kinect_frames(device):
    """Kinect → (color, depth) 제너레이터."""
    while True:
        capture           = device.update()
        ok_c, color_image = capture.get_color_image()
        ok_d, depth_image = capture.get_depth_image()
        yield (color_image if ok_c else None,
               depth_image if ok_d else None)


def _webcam_frames(cap):
    """웹캠 → (color, None) 제너레이터."""
    while True:
        ret, frame = cap.read()
        yield (frame if ret else None, None)


# ── 실행 함수 ─────────────────────────────────────────

def run_kinect(classifier: PostureClassifier, cfg: CaptureSettings) -> None:
    pykinect.initialize_libraries()
    device_cfg = pykinect.default_configuration
    device_cfg.color_resolution = pykinect.K4A_COLOR_RESOLUTION_1080P
    device_cfg.depth_mode       = pykinect.K4A_DEPTH_MODE_NFOV_UNBINNED
    device = pykinect.start_device(config=device_cfg)
    print("[Kinect] 연결 완료 — 웹에서 '기록 시작'을 눌러주세요\n")
    try:
        run_loop(
            frame_source = _kinect_frames(device),
            get_status   = get_status,
            set_stream   = stream.set_frame,
            classify     = classifier.classify,
            upload       = upload,
            save_dir     = SAVE_DIR,
            cfg          = cfg,
            use_depth    = True,
        )
    finally:
        device.close()
        print("[Kinect] 장치 종료")


def run_webcam(classifier: PostureClassifier, cfg: CaptureSettings) -> None:
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("웹캠 연결 실패")
    print("[웹캠] 연결 완료 — 웹에서 '기록 시작'을 눌러주세요\n")
    try:
        run_loop(
            frame_source = _webcam_frames(cap),
            get_status   = get_status,
            set_stream   = stream.set_frame,
            classify     = classifier.classify,
            upload       = upload,
            save_dir     = SAVE_DIR,
            cfg          = cfg,
            use_depth    = False,
        )
    finally:
        cap.release()
        print("[웹캠] 장치 종료")


# ── 메인 ─────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 50)
    print(" SleepLab 캡처 서비스")
    print(f" 스트림: http://localhost:{STREAM_PORT}/stream")
    print(f" 저장 폴더: {SAVE_DIR}")
    print("=" * 50 + "\n")

    stream.start(STREAM_PORT)
    classifier = PostureClassifier()
    cfg        = _load_settings()
    reset_session()

    delay = RETRY_DELAY
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            if KINECT_AVAILABLE:
                run_kinect(classifier, cfg)
            else:
                run_webcam(classifier, cfg)
            break  # 정상 종료
        except Exception as e:
            if attempt == MAX_RETRIES:
                print(f"\n[오류] 최대 재시작 횟수 초과 — 종료합니다.")
                sys.exit(1)
            print(f"\n[오류] {e}")
            print(f"  → {delay}초 후 재시작 ({attempt}/{MAX_RETRIES})")
            time.sleep(delay)
            delay = min(delay * 2, 60)

    print("\n서비스 종료.")
