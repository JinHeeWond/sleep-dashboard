# Windows + Kinect 셋업 (백엔드)

Mac 웹 대시보드와 같은 Supabase 프로젝트를 공유합니다. 이 폴더의 노트북은 Azure Kinect로 자세를 캡처해 `posture_log` 테이블에 INSERT 합니다.

## 사전 준비

- Windows + Azure Kinect DK 연결 + Kinect SDK 설치
- Python 3.10
- VS Code or Jupyter

## 1단계 — 본인 계정 만들기

1. Mac 담당자한테 받은 웹 주소(예: `http://<mac-ip>:3000/login` 또는 배포 URL)로 접속
2. **회원가입** 탭 → 본인 이메일/비밀번호로 가입
3. Supabase 대시보드 (Mac 담당자한테 받은 링크) → **Authentication → Users** → 본인 행 클릭 → **User UID** 복사

## 2단계 — 의존성 설치

```bash
pip install supabase python-dotenv opencv-python numpy pykinect_azure
```

## 3단계 — 환경변수 설정

레포 루트(`sleep-dashboard/`)에 `.env.local` 파일 생성 (없으면):

```
NEXT_PUBLIC_SUPABASE_URL=<Mac 담당자한테 받기>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Mac 담당자한테 받기>
SLEEP_USER_ID=<1단계에서 복사한 본인 UUID>
```

## 4단계 — 연결 확인

```bash
cd backend/notebooks
jupyter notebook
```

`week2_00_supabase_test.ipynb` 열고 위에서부터 실행 → "[Supabase] ✅ 연결 성공" 떠야 함.

## 5단계 — 실제 캡처

| 노트북 | 용도 |
|--------|------|
| `week2_01_regular_capture.ipynb` | 정기 촬영 테스트 (1분 간격) |
| `week2_02_motion_capture.ipynb` | 움직임 감지 촬영 테스트 |
| `week2_03_timelapse.ipynb` | 캡처한 프레임으로 타임랩스 mp4 생성 |
| `week2_04_posture_classify.ipynb` | **메인**: 자세 분류 + `posture_log` INSERT |

`week2_04_posture_classify.ipynb` 실행하면 자동으로 본인 UUID 박혀서 Supabase에 들어가요.

## 6단계 — 동작 확인

캡처 끝나면 Mac 담당자한테 자기 이메일/비번 알려줘서 본인 계정으로 로그인 → 대시보드에 데이터 보이는지 확인하면 끝.

## 문제 해결

| 에러 | 원인 / 해결 |
|------|------------|
| `EnvironmentError: SLEEP_USER_ID 가 비어있습니다` | 3단계 .env.local에 UUID 안 넣음 |
| `EnvironmentError: SUPABASE_URL ...` | URL/KEY 환경변수 누락 |
| `pykinect_azure` import 실패 | Kinect SDK 설치 확인 또는 노트북이 웹캠 모드로 자동 폴백 |
| `posture_log` INSERT 시 `null value in column "user_id"` | `_user_id()` 가 호출 안 되는 옛날 코드 — 최신 `backend/utils/db.py` 받았는지 확인 |
