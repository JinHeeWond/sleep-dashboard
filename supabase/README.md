# Supabase 연결 가이드 (Mac에서 5분이면 끝)

대시보드는 Supabase 키가 없으면 mock 데이터로 동작합니다.
키를 꽂는 순간부터 진짜 데이터(=Python 담당자가 올린 자세 로그)를 읽습니다.

## 1. Supabase 프로젝트 만들기

1. https://supabase.com 가입 (GitHub 계정으로 즉시 가능, 무료)
2. **New project** 클릭 → 이름 `sleeplab` (아무거나), 비밀번호 메모해두기, region은 `Northeast Asia (Seoul)` 추천
3. 1~2분 기다리면 프로비저닝 완료

## 2. 테이블 만들기

1. 좌측 메뉴 **SQL Editor** → **New query**
2. `supabase/schema.sql` 파일 전체 복사해서 붙여넣기
3. 우측 하단 **Run** (또는 Cmd+Enter)
4. 좌측 **Table Editor**에서 `posture_logs / sleep_sessions / morning_conditions` 3개 테이블이 생겼는지 확인

(선택) 샘플 데이터 한 줄 넣어보고 싶으면 같은 방식으로 `seed.sql` 실행.

## 3. Storage 버킷 (타임랩스 mp4 저장용, 나중에 필요할 때)

1. 좌측 **Storage** → **New bucket** → 이름 `timelapses` → **Public bucket** 체크 → Create
2. (Python 담당자가 mp4 업로드하면 `sleep_sessions.timelapse_url`에 그 경로를 저장)

## 4. 키 가져와서 .env에 넣기

1. 좌측 **Project Settings** (톱니바퀴) → **API**
2. 두 값 복사:
   - `Project URL` (예: `https://abcde12345.supabase.co`)
   - `anon` `public` key (긴 JWT 문자열)
3. 프로젝트 루트에 `.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=여기에_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_key
```

4. `npm run dev` 재시작

## 5. 동작 확인

- 대시보드에서 **/condition**으로 이동
- 개운함/통증 입력하고 **저장하기** 클릭
- Supabase 대시보드 → Table Editor → `morning_conditions` 들어가서 행이 생겼으면 성공!

## 6. Python 담당자에게 전달할 것

`python-uploader/` 폴더 통째로 Windows쪽에 복사해 보내면 됩니다. README 따라하면 Kinect CSV가 자동으로 Supabase에 올라갑니다.

키 두 개 (URL + anon key) 같이 전달하면 됨.

---

## 추후 정리할 것 (지금은 신경 안 써도 됨)

- 현재 RLS는 데모 모드 (누구나 읽기/쓰기). 실제 배포하면 Supabase Auth 붙이고 `auth.uid() = user_id` 정책으로 잠그기
- `user_id` 컬럼이 지금은 `'demo'` 고정 → Auth 붙으면 uuid 타입으로 바꾸기
