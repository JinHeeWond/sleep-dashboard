# SleepLab — Sleep Dashboard

Next.js 16 (App Router) + Supabase. 이메일/비밀번호로 로그인하고, Kinect/Python이 Supabase에 올린 수면 자세 데이터를 본인 계정 기준으로 보여줍니다.

**관련 레포:**
- 백엔드(Windows + Kinect 자세 분류): [HCI_Project_SleepPostureAnalysis](https://github.com/Gooddandelion/HCI_Project_SleepPostureAnalysis)
- 이 레포는 백엔드와 동일한 Supabase 테이블(`posture_log`, `morning_conditions`)을 공유합니다.

## Setup

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 + 스키마

1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor → `supabase/schema.sql` 내용 붙여넣고 실행
   - ⚠️ 구버전 테이블(`posture_logs`, `sleep_sessions`)이 있으면 DROP 됩니다.
   - 새 테이블: `posture_log`, `morning_conditions`, Storage `sleep-images` 버킷

### 3. Supabase Auth 설정

1. **Supabase 대시보드** → Authentication → Sign In / Up
   - **Confirm email**: **OFF** ← 가입 즉시 로그인되도록

> Email + Password만 사용. Google OAuth 등 외부 provider 불필요.

### 4. 환경 변수

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### 5. 실행

```bash
npm run dev
```

http://localhost:3000 → "대시보드 열기" → 회원가입 → 대시보드.

## Architecture

```
   [Mac 웹 (이 레포)] ────┐
                          ├──→  [Supabase]
   [Windows + Kinect] ────┘    posture_log
   (백엔드 레포)               morning_conditions
                              auth.users
```

- **Mac 웹**: 데이터 조회/시각화 + 아침 컨디션 입력
- **Windows + Kinect**: Azure Kinect로 자세 캡처 후 `posture_log`에 INSERT
- **공통 키**: `user_id` 컬럼에 Supabase Auth user UUID

### 데이터 격리

- 모든 fetch는 `where user_id = <내 UUID>` 로 필터링됨 (`src/lib/data.ts`)
- 페이지는 `requireUser()` 가드로 비로그인 접근 시 `/login`으로 redirect
- 대시보드의 세션 요약은 `posture_log`를 날짜별로 집계해서 도출 (별도 sessions 테이블 없음)

## 백엔드 레포 (Kinect 사이드) 연동 가이드

백엔드 레포의 `backend/utils/db.py::insert_posture()` 가 `posture_log`에 행을 넣을 때,
**`user_id` 필드를 반드시 같이 넣어야** 이 대시보드에 본인 데이터가 보입니다.

### 백엔드 측 코드 수정 필요사항

`backend/utils/db.py` 의 `insert_posture()` 함수에:

```python
row = {
    "user_id":      os.environ.get("SLEEP_USER_ID"),  # ← 추가
    "timestamp":    timestamp,
    "datetime":     dt_str,
    "posture":      posture,
    "angle":        round(float(angle), 2),
    "capture_type": capture_type,
    "image_path":   stored_path,
}
```

그리고 Kinect PC의 `.env`에:

```
SLEEP_USER_ID=<본인 Supabase Auth UUID>
```

본인 UUID는 Supabase 대시보드 → **Authentication → Users** → 본인 행 → ID 컬럼에서 복사.

## python-uploader/ (dev 보조 도구)

CSV로 자세 로그를 일괄 업로드할 때 쓰는 헬퍼 스크립트. Kinect 없이 mock 데이터로
대시보드 동작 확인할 때 유용. **운영용 코드는 아니에요** — 백엔드 레포가 정식.

```bash
export SUPABASE_URL=https://...supabase.co
export SUPABASE_ANON_KEY=...
export SLEEP_USER_ID=<본인 UUID>
python python-uploader/upload_to_supabase.py results/test.csv
```

## Production 체크리스트

- [ ] Supabase Site URL을 배포 도메인으로 변경
- [ ] `supabase/schema.sql`의 RLS 정책을 `auth.uid()::text = user_id`로 변경
- [ ] Confirm email을 ON으로 켜기 (운영 환경 권장)
- [ ] Mock data 폴백 제거 — 빈 상태(empty state)로 교체
