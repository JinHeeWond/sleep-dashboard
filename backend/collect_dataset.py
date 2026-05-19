"""
뎁스 이미지 데이터셋 수집 스크립트
=====================================
자세별로 20장씩, 5초 간격으로 뎁스 colormap 이미지를 저장합니다.

실행:
    cd sleep-dashboard/backend
    python collect_dataset.py
"""

import sys
import time
import cv2
import numpy as np
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

# ── 설정 ─────────────────────────────────────────────
CLASSES          = ["Supine", "Lateral_L", "Lateral_R", "Prone"]
IMAGES_PER_CLASS = 20
INTERVAL_SEC     = 3
READY_SEC        =  5         # 자세 잡을 준비 시간
OUTPUT_DIR       = Path(__file__).parent / "dataset_depth"

# Kinect 감지
try:
    import pykinect_azure as pykinect
    KINECT_AVAILABLE = True
except ImportError:
    KINECT_AVAILABLE = False


# ── 유틸 ─────────────────────────────────────────────

def depth_colormap(depth_img) -> np.ndarray:
    norm = cv2.normalize(depth_img, None, 0, 255, cv2.NORM_MINMAX).astype("uint8")
    return cv2.applyColorMap(norm, cv2.COLORMAP_JET)


def imwrite(path: Path, img: np.ndarray) -> None:
    _, buf = cv2.imencode(".png", img)
    path.write_bytes(buf.tobytes())


def countdown(seconds: int, msg: str = "") -> None:
    for i in range(seconds, 0, -1):
        print(f"\r  {msg} {i}초 후 시작…  ", end="", flush=True)
        time.sleep(1)
    print()


def progress_bar(current: int, total: int, width: int = 20) -> str:
    filled = int(width * current / total)
    bar    = "█" * filled + "░" * (width - filled)
    return f"[{bar}] {current}/{total}"


# ── Kinect 수집 ───────────────────────────────────────

def collect_kinect() -> None:
    pykinect.initialize_libraries()
    cfg = pykinect.default_configuration
    cfg.color_resolution = pykinect.K4A_COLOR_RESOLUTION_1080P
    cfg.depth_mode       = pykinect.K4A_DEPTH_MODE_NFOV_UNBINNED
    device = pykinect.start_device(config=cfg)
    print("[Kinect] 연결 완료\n")

    try:
        for cls in CLASSES:
            out_dir = OUTPUT_DIR / cls
            out_dir.mkdir(parents=True, exist_ok=True)

            # 기존 파일 수 확인
            existing = len(list(out_dir.glob("*.png")))
            remaining = IMAGES_PER_CLASS - existing
            if remaining <= 0:
                print(f"[{cls}] 이미 {existing}장 완료 — 건너뜀")
                continue

            print("=" * 50)
            print(f"  자세: {cls}")
            print(f"  목표: {remaining}장 더 촬영 ({existing}/{IMAGES_PER_CLASS})")
            print("=" * 50)
            print(f"  지금 [{cls}] 자세를 잡아주세요.")
            countdown(READY_SEC, "촬영")

            count = existing
            while count < IMAGES_PER_CLASS:
                # 프레임 획득
                capture           = device.update()
                ok_c, color_image = capture.get_color_image()
                ok_d, depth_image = capture.get_depth_image()

                if not ok_d:
                    time.sleep(0.1)
                    continue

                ts    = int(time.time() * 1000)
                fname = out_dir / f"{ts}.png"
                imwrite(fname, depth_colormap(depth_image))
                count += 1

                print(f"  {progress_bar(count, IMAGES_PER_CLASS)}  저장: {fname.name}")

                if count < IMAGES_PER_CLASS:
                    countdown(INTERVAL_SEC, "다음 촬영까지")

            print(f"\n[{cls}] 완료 ✓\n")

    finally:
        device.close()
        print("[Kinect] 장치 종료")


# ── 웹캠 수집 (fallback) ──────────────────────────────

def collect_webcam() -> None:
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[오류] 웹캠 연결 실패")
        return
    print("[웹캠 모드] Kinect 없음 — 컬러 이미지로 대체\n")

    try:
        for cls in CLASSES:
            out_dir = OUTPUT_DIR / cls
            out_dir.mkdir(parents=True, exist_ok=True)

            existing  = len(list(out_dir.glob("*.png")))
            remaining = IMAGES_PER_CLASS - existing
            if remaining <= 0:
                print(f"[{cls}] 이미 {existing}장 완료 — 건너뜀")
                continue

            print("=" * 50)
            print(f"  자세: {cls}")
            print(f"  목표: {remaining}장 더 촬영 ({existing}/{IMAGES_PER_CLASS})")
            print("=" * 50)
            print(f"  지금 [{cls}] 자세를 잡아주세요.")
            countdown(READY_SEC, "촬영")

            count = existing
            while count < IMAGES_PER_CLASS:
                ret, frame = cap.read()
                if not ret:
                    time.sleep(0.1)
                    continue

                ts    = int(time.time() * 1000)
                fname = out_dir / f"{ts}.png"
                imwrite(fname, frame)
                count += 1

                print(f"  {progress_bar(count, IMAGES_PER_CLASS)}  저장: {fname.name}")

                if count < IMAGES_PER_CLASS:
                    countdown(INTERVAL_SEC, "다음 촬영까지")

            print(f"\n[{cls}] 완료 ✓\n")

    finally:
        cap.release()
        print("[웹캠] 장치 종료")


# ── 메인 ─────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 50)
    print(" 뎁스 이미지 데이터셋 수집")
    print(f" 저장 폴더: {OUTPUT_DIR}")
    print(f" 자세: {', '.join(CLASSES)}")
    print(f" 장당 장수: {IMAGES_PER_CLASS}장  /  간격: {INTERVAL_SEC}초")
    print("=" * 50 + "\n")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if KINECT_AVAILABLE:
        collect_kinect()
    else:
        collect_webcam()

    # 최종 결과 요약
    print("\n[완료] 수집 결과:")
    for cls in CLASSES:
        count = len(list((OUTPUT_DIR / cls).glob("*.png")))
        bar   = "✓" if count >= IMAGES_PER_CLASS else f"{count}/{IMAGES_PER_CLASS}"
        print(f"  {cls:12s}: {bar}")

    print(f"\n저장 위치: {OUTPUT_DIR.resolve()}")
    print("다음 단계: week3_train_posture_model.ipynb 에서 DATASET_ZIP 경로를 dataset_depth/로 변경 후 재학습")
