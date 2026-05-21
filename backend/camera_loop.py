"""
카메라 공통 캡처 루프.

Kinect와 웹캠의 루프 로직이 동일하므로 frame_source 제너레이터로 추상화합니다.
  frame_source → (color_frame, depth_frame | None) 을 무한히 yield
"""

import time
import cv2
import numpy as np
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Callable, Generator, Tuple, Any


@dataclass
class CaptureSettings:
    interval_sec:    int   = 10
    motion_thr:      int   = 12
    motion_cooldown: int   = 10
    motion_settle:   int   = 20
    motion_check:    int   = 5
    poll_sec:        int   = 3
    analysis_batch:  int   = 1


# ── 유틸 ──────────────────────────────────────────────

def depth_colormap(depth_img) -> np.ndarray:
    norm = cv2.normalize(depth_img, None, 0, 255, cv2.NORM_MINMAX).astype("uint8")
    return cv2.applyColorMap(norm, cv2.COLORMAP_JET)


def imwrite(path: str, img) -> bool:
    """한글 경로 대응 저장."""
    try:
        _, buf = cv2.imencode(Path(path).suffix or ".png", img)
        Path(path).write_bytes(buf.tobytes())
        return True
    except Exception as e:
        print(f"  [저장 실패] {path}: {e}")
        return False


def _ts() -> str:
    return datetime.now().strftime("%H:%M:%S")


# ── 공통 루프 ──────────────────────────────────────────

def run(
    frame_source: Generator[Tuple[Any, Any], None, None],
    get_status:   Callable[[], str],
    set_stream:   Callable,
    classify:     Callable[[str], str],
    upload:       Callable[[int, str, str, str], None],
    save_dir:     Path,
    cfg:          CaptureSettings,
    use_depth:    bool = False,
) -> None:
    """
    frame_source: (color, depth) 튜플을 yield하는 제너레이터
    use_depth:    True면 depth colormap 이미지로 분류 (Kinect 전용)
    """
    last_regular       = 0.0
    last_motion        = 0.0
    last_motion_upload = 0.0
    motion_settle_due  = None
    prev_small         = None
    has_recorded       = False
    batch_paths: list[str] = []

    for color, depth in frame_source:
        if color is not None:
            set_stream(color)

        status = get_status()

        if status == "idle":
            if has_recorded:
                print(f"\n[{_ts()}] 초기화 신호 수신 — 루프 종료")
                return
            print(f"\r[{_ts()}] 대기 중…", end="", flush=True)
            time.sleep(cfg.poll_sec)
            continue

        if status == "paused":
            print(f"\r[{_ts()}] 일시 정지 중…", end="", flush=True)
            time.sleep(cfg.poll_sec)
            continue

        if color is None:
            time.sleep(0.1)
            continue

        has_recorded = True
        now = time.time()
        ts  = int(now)

        # ── 정기 촬영 ────────────────────────────────
        if now - last_regular >= cfg.interval_sec:
            color_path = str(save_dir / f"{ts}_regular_color.png")
            imwrite(color_path, color)
            if use_depth and depth is not None:
                analysis_path = str(save_dir / f"{ts}_regular_depth.png")
                imwrite(analysis_path, depth_colormap(depth))
            else:
                analysis_path = color_path

            last_regular = now
            batch_paths.append(analysis_path)
            print(f"\n[{_ts()}] 정기 촬영 ({len(batch_paths)}/{cfg.analysis_batch}장)")

            if len(batch_paths) >= cfg.analysis_batch:
                posture = classify(batch_paths[-1])
                print(f"  → {posture}")
                upload(ts, color_path, "regular", posture)
                batch_paths.clear()

        # ── 움직임 감지 후 안정 대기 캡처 ──────────
        if motion_settle_due is not None and now >= motion_settle_due:
            color_path = str(save_dir / f"{ts}_motion_color.png")
            imwrite(color_path, color)
            if use_depth and depth is not None:
                analysis_path = str(save_dir / f"{ts}_motion_depth.png")
                imwrite(analysis_path, depth_colormap(depth))
            else:
                analysis_path = color_path

            posture = classify(analysis_path)
            print(f"\n[{_ts()}] 움직임 후 자세 분석: {posture}")
            upload(ts, color_path, "motion", posture)
            last_motion_upload = now
            motion_settle_due  = None

        # ── 움직임 감지 ──────────────────────────────
        if now - last_motion >= cfg.motion_check:
            small = cv2.resize(cv2.cvtColor(color, cv2.COLOR_BGR2GRAY), (160, 90))
            if prev_small is not None:
                score = float(cv2.absdiff(small, prev_small).mean())
                print(f"\r  움직임: {score:.1f} (임계 {cfg.motion_thr})", end="", flush=True)
                if (score > cfg.motion_thr
                        and now - last_motion_upload >= cfg.motion_cooldown
                        and motion_settle_due is None):
                    motion_settle_due = now + cfg.motion_settle
                    print(f"\n[{_ts()}] 움직임 감지 ({score:.1f}) → {cfg.motion_settle}초 후 캡처")
            prev_small  = small
            last_motion = now

        time.sleep(0.1)
