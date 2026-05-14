"""
=====================================================
 backend/utils/db.py
 Supabase 연동 모듈
 - Storage 이미지 업로드 / 공개 URL 반환
 - posture_log 저장 / 조회
 - condition_log 저장 / 조회

 사용법:
     from utils.db import insert_posture, fetch_posture_by_date
=====================================================
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# backend/ 를 sys.path 에 추가 (config.py 와 utils 패키지가 거기 있음)
sys.path.append(str(Path(__file__).parent.parent))
from config import TABLE_POSTURE_LOG, TABLE_CONDITION

# .env / .env.local 로드
try:
    from dotenv import load_dotenv

    # 후보 경로를 순서대로 시도 — 어느 경로에서 실행해도 찾을 수 있도록
    _candidates = [
        Path(__file__).resolve().parent.parent.parent,  # sleep-dashboard/ (db.py 기준)
        Path.cwd(),                                     # 현재 작업 디렉토리
        Path.cwd().parent,                              # 한 단계 위
        Path.cwd().parent.parent,                       # 두 단계 위
    ]
    for _root in _candidates:
        if (_root / ".env.local").exists():
            load_dotenv(_root / ".env.local")
            break
        if (_root / ".env").exists():
            load_dotenv(_root / ".env")
            break
    else:
        print("[db] ⚠️  .env.local 파일을 찾지 못했습니다. 환경변수가 직접 설정되어 있어야 합니다.")
except ImportError:
    pass

from supabase import create_client, Client


# ── Supabase 클라이언트 초기화 ─────────────────────
def get_client() -> Client:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = (
        os.environ.get("SUPABASE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )

    if not url or not key:
        raise EnvironmentError(
            ".env.local 파일에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가\n"
            "또는 SUPABASE_URL / SUPABASE_KEY 가 설정되어 있어야 합니다."
        )
    return create_client(url, key)


# ── 현재 사용자 식별자 ────────────────────────────
# 우선순위:
#   1) SLEEP_EMAIL + SLEEP_PASSWORD  → Supabase Auth 로그인 후 UUID 자동 취득
#   2) SLEEP_USER_ID                 → 수동 입력 (구버전 호환)
_cached_uid: str | None = None

def _user_id() -> str:
    global _cached_uid
    if _cached_uid:
        return _cached_uid

    email    = os.environ.get("SLEEP_EMAIL")
    password = os.environ.get("SLEEP_PASSWORD")
    if email and password:
        try:
            resp = get_client().auth.sign_in_with_password(
                {"email": email, "password": password}
            )
            _cached_uid = resp.user.id
            print(f"[Auth] ✅ 로그인 성공: {email}")
            return _cached_uid
        except Exception as e:
            raise EnvironmentError(f"[Auth] 로그인 실패: {e}")

    uid = os.environ.get("SLEEP_USER_ID")
    if uid:
        _cached_uid = uid
        return _cached_uid

    raise EnvironmentError(
        ".env.local 에 인증 정보를 입력해주세요.\n"
        "  방법 1 (권장): SLEEP_EMAIL=이메일  SLEEP_PASSWORD=비밀번호\n"
        "  방법 2 (수동): SLEEP_USER_ID=<uuid>"
    )


# ── Storage: 이미지 업로드 ─────────────────────────
STORAGE_BUCKET = "sleep-images"   # Supabase Storage 버킷 이름


def upload_image(local_path: str) -> str:
    """
    로컬 이미지를 Supabase Storage에 업로드하고 공개 URL을 반환합니다.

    Storage 경로 구조:
        sleep-images/
          └── YYYYMMDD/
                └── {timestamp}_{type}_color.png

    반환:
        업로드 성공 → 공개 URL (str)
        업로드 실패 → 로컬 경로 (str) — DB에는 저장되지만 웹에서 이미지 불러오기 불가

    사전 준비 (최초 1회):
        Supabase 대시보드 → Storage → New bucket
        이름: sleep-images / Public: ON
    """
    supabase   = get_client()
    local_path = Path(local_path)

    if not local_path.exists():
        print(f"[Storage] 파일 없음: {local_path}")
        return str(local_path)

    # Storage 경로: YYYYMMDD/파일명
    date_folder   = local_path.parent.name   # ex) 20250510
    storage_path  = f"{date_folder}/{local_path.name}"

    try:
        with open(local_path, "rb") as f:
            supabase.storage.from_(STORAGE_BUCKET).upload(
                path=storage_path,
                file=f,
                file_options={
                    "content-type": "image/png",
                    "upsert": "true",   # 같은 파일명이면 덮어쓰기
                }
            )

        # 공개 URL 반환
        public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(
            storage_path
        )
        print(f"[Storage] ✅ 업로드 완료 → {public_url}")
        return public_url

    except Exception as e:
        print(f"[Storage] ❌ 업로드 실패 ({e}) → 로컬 경로로 저장")
        return str(local_path)


def upload_image_pair(color_path: str, depth_path: str) -> tuple[str, str]:
    """
    RGB + 뎁스 이미지를 동시에 업로드하고 각각의 공개 URL을 반환합니다.
    반환: (color_url, depth_url)
    """
    color_url = upload_image(color_path)
    depth_url = upload_image(depth_path)
    return color_url, depth_url


def get_image_url(storage_path: str) -> str:
    """
    Storage 경로로 공개 URL 조회 (업로드 없이 URL만 필요할 때)
    storage_path: ex) "20250510/1746000000_regular_color.png"
    """
    supabase = get_client()
    return supabase.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)


def list_storage_images(date_folder: str) -> list[dict]:
    """
    Supabase Storage의 날짜 폴더에서 color 이미지 목록 조회
    date_folder: "YYYYMMDD"
    반환: [{"name": "...", "url": "https://...", "timestamp": int, "capture_type": str}, ...]
    """
    supabase = get_client()
    try:
        files = supabase.storage.from_(STORAGE_BUCKET).list(date_folder)
    except Exception as e:
        print(f"[Storage] 목록 조회 실패: {e}")
        return []

    result = []
    for f in files:
        name = f.get("name", "")
        if "_depth" in name or not name.endswith(".png"):
            continue
        parts = name.replace(".png", "").split("_")
        if len(parts) < 2:
            continue
        try:
            ts           = int(parts[0])
            capture_type = parts[1]
            url          = supabase.storage.from_(STORAGE_BUCKET).get_public_url(
                f"{date_folder}/{name}"
            )
            result.append({"name": name, "url": url,
                           "timestamp": ts, "capture_type": capture_type})
        except ValueError:
            continue

    return sorted(result, key=lambda x: x["timestamp"])


# ── posture_log ────────────────────────────────────
def insert_posture(timestamp: int, posture: str, angle: float,
                   capture_type: str, image_path: str,
                   upload: bool = True) -> dict:
    """
    자세 분류 결과를 Supabase posture_log 테이블에 저장

    image_path: 로컬 이미지 경로
    upload:     True  → Storage에 자동 업로드 후 공개 URL을 DB에 저장
                False → 로컬 경로를 그대로 DB에 저장 (오프라인/테스트용)

    반환: 저장된 row (dict)
    """
    supabase = get_client()
    dt_str   = datetime.fromtimestamp(timestamp).isoformat()

    # 이미지 Storage 업로드
    if upload and image_path and Path(image_path).exists():
        stored_path = upload_image(image_path)
    else:
        stored_path = image_path   # 로컬 경로 그대로 저장

    row = {
        "user_id":      _user_id(),
        "timestamp":    timestamp,
        "datetime":     dt_str,
        "posture":      posture,
        "angle":        round(float(angle), 2),
        "capture_type": capture_type,
        "image_path":   stored_path,   # 공개 URL or 로컬 경로
    }
    result = supabase.table(TABLE_POSTURE_LOG).insert(row).execute()
    return result.data[0] if result.data else {}


def fetch_posture_by_date(target_date: str) -> list[dict]:
    """
    특정 날짜의 자세 로그 전체 조회 (본인 user_id 만)
    target_date: "YYYY-MM-DD" 형식
    반환: [{id, timestamp, posture, ...}, ...]
    """
    supabase = get_client()
    start    = f"{target_date}T00:00:00"
    end      = f"{target_date}T23:59:59"

    result = (
        supabase.table(TABLE_POSTURE_LOG)
        .select("*")
        .eq("user_id", _user_id())
        .gte("datetime", start)
        .lte("datetime", end)
        .order("datetime", desc=False)
        .execute()
    )
    return result.data or []


def fetch_posture_latest(limit: int = 100) -> list[dict]:
    """최근 N개 자세 로그 조회 (본인 user_id 만)"""
    supabase = get_client()
    result   = (
        supabase.table(TABLE_POSTURE_LOG)
        .select("*")
        .eq("user_id", _user_id())
        .order("datetime", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


# ── condition_log ──────────────────────────────────
def insert_condition(log_date: str, refresh_level: int,
                     pain_neck: bool, pain_shoulder: bool,
                     pain_back: bool, memo: str = "") -> dict:
    """
    기상 후 컨디션을 Supabase morning_conditions 테이블에 저장
    log_date: "YYYY-MM-DD" 형식
    refresh_level: 1(최악) ~ 5(최고)

    실제 DB 컬럼명:
        date / refreshment / pain_neck / pain_shoulder / pain_back
    """
    supabase = get_client()
    row = {
        "user_id":      _user_id(),
        "date":         log_date,
        "refreshment":  refresh_level,
        "pain_neck":    pain_neck,
        "pain_shoulder":pain_shoulder,
        "pain_back":    pain_back,
    }
    # upsert: 같은 (user_id, date) 면 덮어쓰기
    result = (
        supabase.table(TABLE_CONDITION)
        .upsert(row, on_conflict="user_id,date")
        .execute()
    )
    return result.data[0] if result.data else {}


def fetch_condition_by_date(log_date: str) -> dict:
    """특정 날짜 컨디션 조회 (본인 user_id 만)"""
    supabase = get_client()
    result   = (
        supabase.table(TABLE_CONDITION)
        .select("*")
        .eq("user_id", _user_id())
        .eq("date", log_date)
        .execute()
    )
    return result.data[0] if result.data else {}


def fetch_condition_all() -> list[dict]:
    """전체 컨디션 로그 조회 (본인 user_id 만, 최신순)"""
    supabase = get_client()
    result   = (
        supabase.table(TABLE_CONDITION)
        .select("*")
        .eq("user_id", _user_id())
        .order("date", desc=True)
        .execute()
    )
    return result.data or []


# ── 연결 테스트 ────────────────────────────────────
def test_connection() -> bool:
    """Supabase 연결 확인용"""
    try:
        supabase = get_client()
        supabase.table(TABLE_POSTURE_LOG).select("id").limit(1).execute()
        print("[Supabase] ✅ 연결 성공")
        return True
    except Exception as e:
        print(f"[Supabase] ❌ 연결 실패: {e}")
        return False


if __name__ == "__main__":
    test_connection()