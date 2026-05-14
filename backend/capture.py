"""
SleepLab — 수면 캡처 서비스
============================
웹 대시보드 버튼으로 Kinect를 제어하고,
localhost:8765/stream 으로 라이브 영상을 스트리밍합니다.

  기록 시작  →  촬영 시작 / 재개
  일시 정지  →  촬영 멈춤 (Kinect 유지)
  초기화     →  Kinect 종료 + 프로세스 종료

실행:
    cd sleep-dashboard/backend
    python capture.py
"""

import cv2
import os
import sys
import time
import threading
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from utils.db import get_client, _user_id, insert_posture

import google.generativeai as genai
from PIL import Image as PILImage

# ── 설정 ─────────────────────────────────────────────
INTERVAL_SEC      = 60   # 정기 촬영 간격 (초)
ANALYSIS_BATCH    = 5    # 정기 촬영 N장마다 자세 분석 (5장 = 5분)
MOTION_CHECK      = 5    # 움직임 감지 체크 간격 (초)
MOTION_THR        = 25   # 움직임 감지 임계값
POLL_SEC          = 3    # 웹 상태 폴링 간격 (초)
SHOW_PREVIEW      = False
STREAM_PORT       = 8765
TABLE_SESSIONS    = "recording_sessions"
MOTION_COOLDOWN   = 30   # 움직임 캡처 최소 간격 (초) — API 과다 호출 방지
DATASET_DIR       = str(Path(__file__).parent / "Dataset")

SAVE_DIR = Path(__file__).parent / "sleep_frames" / datetime.now().strftime("%Y%m%d")
SAVE_DIR.mkdir(parents=True, exist_ok=True)

# ── 스트림 공유 버퍼 ─────────────────────────────────
_latest_frame = None
_frame_lock   = threading.Lock()

def set_frame(img):
    global _latest_frame
    with _frame_lock:
        _latest_frame = img.copy()

def get_frame():
    with _frame_lock:
        return _latest_frame.copy() if _latest_frame is not None else None


# ── MJPEG 스트림 서버 (Flask) ────────────────────────
from flask import Flask, Response

_app = Flask(__name__)

@_app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp

def _gen():
    while True:
        frame = get_frame()
        if frame is None:
            time.sleep(0.05)
            continue
        frame_small = cv2.resize(frame, (1280, 720))
        _, buf = cv2.imencode(".jpg", frame_small, [cv2.IMWRITE_JPEG_QUALITY, 75])
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
               + buf.tobytes() + b"\r\n")
        time.sleep(0.05)  # ~20fps

@_app.route("/stream")
def stream():
    return Response(_gen(), mimetype="multipart/x-mixed-replace; boundary=frame")

def _start_stream_server():
    import logging
    log = logging.getLogger("werkzeug")
    log.setLevel(logging.ERROR)
    _app.run(host="0.0.0.0", port=STREAM_PORT, threaded=True, use_reloader=False)


# ── Kinect 감지 ──────────────────────────────────────
try:
    import pykinect_azure as pykinect
    KINECT_AVAILABLE = True
    print("[OK] Kinect 사용 가능")
except ImportError:
    KINECT_AVAILABLE = False
    print("[웹캠 모드] Kinect 없음 → 웹캠으로 대체")


# ── 웹 상태 조회 ─────────────────────────────────────
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
        new_status = r.data[0]["status"] if r.data else _last_status
        if new_status != _last_status:
            print(f"\n[상태 변경] {_last_status} → {new_status}")
        _last_status = new_status
        return _last_status
    except Exception as e:
        print(f"\n  [상태 조회 실패] {e} — 이전 상태({_last_status}) 유지")
        return _last_status  # 오류 시 마지막 상태 유지 (idle로 잘못 종료 방지)


# ── 공통 유틸 ────────────────────────────────────────
def depth_colormap(img):
    norm = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX).astype("uint8")
    return cv2.applyColorMap(norm, cv2.COLORMAP_JET)


# ── Gemini 자세 분류 ─────────────────────────────────
VALID_POSTURES = {"Supine", "Lateral_L", "Lateral_R", "Prone", "Unknown"}
POSTURE_MAPPING = {
    "supine": "Supine",
    "Left":   "Lateral_L",
    "Right":  "Lateral_R",
    "prone":  "Prone",
}

def _build_few_shot() -> list:
    """Dataset 폴더에서 few-shot 예시 로드 (시작 시 1회)"""
    examples = []
    for folder, label in POSTURE_MAPPING.items():
        folder_path = os.path.join(DATASET_DIR, folder)
        if not os.path.isdir(folder_path):
            continue
        files = [f for f in os.listdir(folder_path)
                 if f.lower().endswith((".png", ".jpg", ".jpeg"))]
        if files:
            img = PILImage.open(os.path.join(folder_path, files[0]))
            examples.extend([img, f"이 자세의 정답 라벨은 {label}입니다."])
    return examples

def _init_gemini():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[Gemini] ⚠️  GEMINI_API_KEY 없음 → 자세 분류 비활성화")
        return None, []
    genai.configure(api_key=api_key)
    model      = genai.GenerativeModel("gemini-2.5-flash")
    few_shot   = _build_few_shot()
    loaded_cnt = len([x for x in few_shot if not isinstance(x, str)])
    print(f"[Gemini] ✅ 초기화 완료 — few-shot 예시 {loaded_cnt}장 로드")
    return model, few_shot

_gemini_model, _few_shot = _init_gemini()

def classify_posture(image_paths: list[str]) -> str:
    """
    N장의 이미지(로컬 경로)를 받아 Gemini로 자세 분류.
    반환값: 'Supine' | 'Lateral_L' | 'Lateral_R' | 'Prone' | 'Unknown'
    """
    if _gemini_model is None:
        return "Unknown"
    try:
        # 대표 이미지: 마지막 장 사용
        target = PILImage.open(image_paths[-1])
        contents = [
            "당신은 수면 자세 분류 전문가입니다. 아래 예시를 참고해 마지막 이미지의 자세를 "
            "Supine, Lateral_L, Lateral_R, Prone, Unknown 중 하나로만 답하세요. "
            "다른 말은 일절 하지 마세요."
        ] + _few_shot + ["이제 이 이미지의 자세를 분류하세요:", target]

        response = _gemini_model.generate_content(contents)
        text = response.text.strip()

        # 응답에서 유효한 라벨 추출
        for label in VALID_POSTURES:
            if label in text:
                return label
        return "Unknown"

    except Exception as e:
        print(f"\n[Gemini] 분류 실패: {e}")
        return "Unknown"


def upload(ts: int, color_path: str, kind: str, posture: str = "Unknown"):
    try:
        insert_posture(
            timestamp=ts, posture=posture, angle=0,
            capture_type=kind, image_path=color_path, upload=True,
        )
        print(f"  ✅ {kind} 업로드 완료 (자세: {posture})")
    except Exception as e:
        print(f"  ❌ 업로드 실패: {e}")


# ── Kinect 캡처 루프 ─────────────────────────────────
def run_kinect():
    pykinect.initialize_libraries()
    cfg = pykinect.default_configuration
    cfg.color_resolution = pykinect.K4A_COLOR_RESOLUTION_1080P
    cfg.depth_mode       = pykinect.K4A_DEPTH_MODE_NFOV_UNBINNED
    device = pykinect.start_device(config=cfg)
    print("[Kinect] 연결 완료 — 웹에서 '기록 시작'을 눌러주세요\n")

    last_regular      = 0
    last_motion       = 0
    last_motion_upload = 0          # 모션 업로드 쿨다운용
    prev_small        = None
    has_recorded      = False
    batch_paths: list[str] = []

    try:
        while True:
            # 항상 프레임을 읽어 스트림 유지
            capture           = device.update()
            ok_c, color_image = capture.get_color_image()
            ok_d, depth_image = capture.get_depth_image()

            if ok_c:
                set_frame(color_image)  # 스트림 버퍼 업데이트

            status = get_status()

            # idle: 한 번이라도 recording 된 이후에만 종료
            if status == "idle":
                if has_recorded:
                    print("\n[초기화] Kinect 종료합니다.")
                    break
                else:
                    print(f"\r[{datetime.now().strftime('%H:%M:%S')}] 대기 중… (웹에서 '기록 시작'을 눌러주세요)", end="", flush=True)
                    time.sleep(POLL_SEC)
                    continue

            if status == "paused":
                print(f"\r[{datetime.now().strftime('%H:%M:%S')}] 일시 정지 중…", end="", flush=True)
                time.sleep(POLL_SEC)
                continue

            has_recorded = True  # recording 상태 최초 진입

            if not ok_c or not ok_d:
                time.sleep(0.1)
                continue

            now = time.time()
            ts  = int(now)

            # 정기 촬영
            # ── 정기 촬영 (60초마다) ──────────────────
            if now - last_regular >= INTERVAL_SEC:
                color_path = str(SAVE_DIR / f"{ts}_regular_color.png")
                cv2.imwrite(color_path, color_image)
                cv2.imwrite(str(SAVE_DIR / f"{ts}_regular_depth.png"), depth_colormap(depth_image))
                last_regular = now
                batch_paths.append(color_path)
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 정기 촬영 ({len(batch_paths)}/{ANALYSIS_BATCH}장)")

                # 5장마다 자세 분석 후 업로드
                if len(batch_paths) >= ANALYSIS_BATCH:
                    posture = classify_posture(batch_paths)
                    print(f"  → 자세 분석 완료: {posture}")
                    upload(ts, color_path, "regular", posture)
                    batch_paths = []

            # ── 움직임 감지 (5초마다) ────────────────
            if now - last_motion >= MOTION_CHECK:
                small = cv2.resize(cv2.cvtColor(color_image, cv2.COLOR_BGR2GRAY), (160, 90))
                if prev_small is not None:
                    score = float(cv2.absdiff(small, prev_small).mean())
                    print(f"\r  움직임 점수: {score:.1f} (임계값: {MOTION_THR})", end="", flush=True)
                    if score > MOTION_THR and (now - last_motion_upload) >= MOTION_COOLDOWN:
                        color_path = str(SAVE_DIR / f"{ts}_motion_color.png")
                        cv2.imwrite(color_path, color_image)
                        posture = classify_posture([color_path])
                        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 움직임 감지 (점수: {score:.1f})")
                        upload(ts, color_path, "motion", posture)
                        last_motion_upload = now
                prev_small  = small
                last_motion = now

            time.sleep(0.3)

    finally:
        device.close()
        print("[Kinect] 장치 종료 완료")


# ── 웹캠 캡처 루프 ───────────────────────────────────
def run_webcam():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[오류] 웹캠 연결 실패")
        return

    print("[웹캠] 연결 완료 — 웹에서 '기록 시작'을 눌러주세요\n")
    last_regular       = 0
    last_motion        = 0
    last_motion_upload = 0
    prev_small         = None
    has_recorded       = False
    batch_paths: list[str] = []

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            set_frame(frame)

            status = get_status()

            if status == "idle":
                if has_recorded:
                    print("\n[초기화] 웹캠 종료합니다.")
                    break
                else:
                    print(f"\r[{datetime.now().strftime('%H:%M:%S')}] 대기 중… (웹에서 '기록 시작'을 눌러주세요)", end="", flush=True)
                    time.sleep(POLL_SEC)
                    continue

            if status == "paused":
                print(f"\r[{datetime.now().strftime('%H:%M:%S')}] 일시 정지 중…", end="", flush=True)
                time.sleep(POLL_SEC)
                continue

            has_recorded = True
            now = time.time()
            ts  = int(now)

            # ── 정기 촬영 (60초마다) ──────────────────
            if now - last_regular >= INTERVAL_SEC:
                color_path = str(SAVE_DIR / f"{ts}_regular_color.png")
                cv2.imwrite(color_path, frame)
                cv2.imwrite(str(SAVE_DIR / f"{ts}_regular_depth.png"),
                            cv2.applyColorMap(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), cv2.COLORMAP_JET))
                last_regular = now
                batch_paths.append(color_path)
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 정기 촬영 ({len(batch_paths)}/{ANALYSIS_BATCH}장)")

                if len(batch_paths) >= ANALYSIS_BATCH:
                    posture = classify_posture(batch_paths)
                    print(f"  → 자세 분석 완료: {posture}")
                    upload(ts, color_path, "regular", posture)
                    batch_paths = []

            # ── 움직임 감지 (5초마다) ────────────────
            if now - last_motion >= MOTION_CHECK:
                small = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (160, 90))
                if prev_small is not None:
                    score = float(cv2.absdiff(small, prev_small).mean())
                    print(f"\r  움직임 점수: {score:.1f} (임계값: {MOTION_THR})", end="", flush=True)
                    if score > MOTION_THR and (now - last_motion_upload) >= MOTION_COOLDOWN:
                        color_path = str(SAVE_DIR / f"{ts}_motion_color.png")
                        cv2.imwrite(color_path, frame)
                        posture = classify_posture([color_path])
                        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 움직임 감지 (점수: {score:.1f})")
                        upload(ts, color_path, "motion", posture)
                        last_motion_upload = now
                prev_small  = small
                last_motion = now

            time.sleep(0.1)

    finally:
        cap.release()
        print("[웹캠] 장치 종료 완료")


if __name__ == "__main__":
    print("=" * 50)
    print(" SleepLab 캡처 서비스")
    print(f" 스트림: http://localhost:{STREAM_PORT}/stream")
    print(f" 저장 폴더: {SAVE_DIR}")
    print("=" * 50 + "\n")

    # 스트림 서버를 백그라운드 스레드로 실행
    t = threading.Thread(target=_start_stream_server, daemon=True)
    t.start()
    print(f"[Stream] http://localhost:{STREAM_PORT}/stream 시작됨\n")

    if KINECT_AVAILABLE:
        run_kinect()
    else:
        run_webcam()

    print("\n프로세스 종료. 다시 사용하려면 capture.py를 재실행하세요.")
