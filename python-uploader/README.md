# Python → Supabase 업로더 (Windows쪽 담당자용)

기존 노트북(`week2_04_posture_classify.ipynb`)에서 만든 CSV를 Supabase로 올리는 헬퍼입니다. 키넥트 코드 자체는 손대지 않아요.

## 1) 설치

```bash
pip install supabase
```

## 2) 환경변수 (.env 또는 PowerShell `$env:`)

대시보드 담당이 알려주는 두 값:

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...   # 긴 JWT
SLEEP_USER_ID=demo                 # 안 정해뒀으면 그대로
```

## 3) 두 가지 사용법

### A. 잠 끝난 후 CSV 한 번에 올리기 (가장 간단)

```bash
python upload_to_supabase.py results/20260507_posture_log.csv
```

→ 자세 로그 N개 + 그날 세션 요약 1개가 자동으로 올라갑니다.

### B. 실시간 — 분류 루프에서 한 줄씩 올리기

`week2_04_posture_classify.ipynb`의 `save_to_csv` 호출 옆에 한 줄 추가:

```python
from upload_to_supabase import upload_row

# ... 기존 코드 ...
save_to_csv(ts, posture, angle, "regular", img_path)
upload_row(ts, posture, angle, "regular", img_path)   # ← 추가
```

이러면 Mac 대시보드를 열어둔 채로 실시간으로 자세가 바뀌는 게 보여요.

## 4) (선택) 타임랩스 mp4 업로드

`week2_03_timelapse.ipynb`로 만든 mp4를 Supabase Storage `timelapses` 버킷에 올리고, 그 public URL을 `upload_session(..., timelapse_url=...)`로 같이 넣어주면 분석 페이지에 영상이 뜹니다.

```python
from supabase import create_client
import os

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_ANON_KEY"])
with open("timelapse_20260507.mp4", "rb") as f:
    sb.storage.from_("timelapses").upload("20260507.mp4", f)
public_url = sb.storage.from_("timelapses").get_public_url("20260507.mp4")
```

## 디버깅

- 401 에러 → 키 잘못 복사한 것
- `relation "posture_logs" does not exist` → Supabase에 `schema.sql` 아직 안 돌렸음
- 컬럼 mismatch → 분류 함수가 `Supine|Prone|Lateral_L|Lateral_R|Unknown` 외 값을 반환 중인지 확인
