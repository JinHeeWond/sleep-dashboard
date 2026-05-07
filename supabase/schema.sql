-- ===========================================================================
-- SleepLab Schema · Supabase
-- 사용법: Supabase 대시보드 → SQL Editor → New Query → 이 파일 전체 붙여넣고 RUN
-- ===========================================================================

-- 1) 자세 로그 (Python/Kinect가 매분 + 움직임마다 INSERT)
--    파이썬의 posture_log CSV 컬럼과 1:1 매핑
create table if not exists posture_logs (
  id            bigserial primary key,
  user_id       text default 'demo',                       -- 추후 auth 붙이면 uuid로
  timestamp     bigint not null,                            -- unix seconds (CSV의 timestamp)
  datetime      timestamptz not null,                       -- "YYYY-MM-DD HH:MM:SS" 변환 후
  posture       text not null check (posture in
                  ('Supine','Prone','Lateral_L','Lateral_R','Unknown')),
  angle         numeric(5,2) not null default 0,
  capture_type  text not null check (capture_type in ('regular','motion')),
  image_path    text
);
create index if not exists posture_logs_dt_idx on posture_logs (datetime desc);
create index if not exists posture_logs_user_dt_idx on posture_logs (user_id, datetime desc);


-- 2) 하루치 요약 (대시보드/이력에서 쓰는 카드)
--    Python에서 잠 끝난 뒤 한 번만 upsert하거나, 트리거/뷰로 자동 집계 가능
create table if not exists sleep_sessions (
  id              bigserial primary key,
  user_id         text default 'demo',
  date            date not null,                            -- 기상일 기준 (YYYY-MM-DD)
  start_time      timestamptz not null,
  end_time        timestamptz not null,
  duration_min    int not null,
  score           int not null check (score between 0 and 100),
  motion_count    int not null default 0,
  regular_count   int not null default 0,
  timelapse_url   text,
  unique (user_id, date)
);
create index if not exists sleep_sessions_user_date_idx on sleep_sessions (user_id, date desc);


-- 3) 기상 컨디션 (대시보드에서 직접 입력)
create table if not exists morning_conditions (
  id              bigserial primary key,
  user_id         text default 'demo',
  date            date not null,
  refreshment     int not null check (refreshment between 1 and 5),
  pain_neck       boolean not null default false,
  pain_back       boolean not null default false,
  pain_shoulder   boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (user_id, date)
);


-- 4) RLS (Row Level Security)
--    데모용으로 anon 키만 가지고도 읽기/쓰기 가능하게 열어둠.
--    실제 배포 시에는 auth.uid() = user_id 정책으로 잠가야 함.
alter table posture_logs        enable row level security;
alter table sleep_sessions      enable row level security;
alter table morning_conditions  enable row level security;

drop policy if exists "demo all access posture_logs"       on posture_logs;
drop policy if exists "demo all access sleep_sessions"     on sleep_sessions;
drop policy if exists "demo all access morning_conditions" on morning_conditions;

create policy "demo all access posture_logs"
  on posture_logs for all using (true) with check (true);

create policy "demo all access sleep_sessions"
  on sleep_sessions for all using (true) with check (true);

create policy "demo all access morning_conditions"
  on morning_conditions for all using (true) with check (true);


-- 5) (선택) timelapse mp4 저장용 Storage 버킷
--    이건 SQL이 아니라 Storage 탭에서 "timelapses"라는 public 버킷을 만들면 됩니다.
