"""MJPEG 라이브 스트림 서버."""

import logging
import threading
import time

import cv2
from flask import Flask, Response

_latest_frame: "cv2.typing.MatLike | None" = None
_frame_lock = threading.Lock()

app = Flask(__name__)


def set_frame(img) -> None:
    global _latest_frame
    with _frame_lock:
        _latest_frame = img.copy()


def get_frame():
    with _frame_lock:
        return _latest_frame.copy() if _latest_frame is not None else None


def _generate():
    while True:
        frame = get_frame()
        if frame is None:
            time.sleep(0.05)
            continue
        small = cv2.resize(frame, (1280, 720))
        _, buf = cv2.imencode(".jpg", small, [cv2.IMWRITE_JPEG_QUALITY, 75])
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
               + buf.tobytes() + b"\r\n")
        time.sleep(0.05)  # ~20 fps


@app.after_request
def _cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp


@app.route("/stream")
def stream():
    return Response(_generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


def start(port: int = 8765) -> None:
    """백그라운드 스레드로 스트림 서버 시작."""
    logging.getLogger("werkzeug").setLevel(logging.ERROR)

    def _run():
        app.run(host="0.0.0.0", port=port, threaded=True, use_reloader=False)

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    print(f"[Stream] http://localhost:{port}/stream 시작됨")
