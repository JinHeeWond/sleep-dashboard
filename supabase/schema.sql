-- ===========================================================================
-- SleepLab Schema · Supabase
-- 백엔드 레포 (HCI_Project_SleepPostureAnalysis) 와 동일한 테이블명 사용.
-- 차이점: 멀티 유저 지원을 위해 user_id 컬럼 + (user_id, date) UNIQUE 추가.
--
-- 사용법: Supabase 대시보드 → SQL Editor → New Query → 이 파일 전체 붙여넣고 RUN
-- ⚠️ 기존 posture_logs, sleep_sessions 테이블이 있다면 DROP 됩니다.
-- ===========================================================================

-- 0) 구버전 테이블 정리
drop table if exists posture_logs cascade;
drop table if exists sleep_sessions cascade;


-- 1) 자세 로그 (Kinect/Python이 매분 + 움직임마다 INSERT)
create table if not exists posture_log (
  id            bigserial primary key,
  user_id       text not null,
  timestamp     bigint not null,                          -- unix seconds
  datetime      timestamptz not null,
  posture       text not null check (posture in
                  ('Supine','Prone','Lateral_L','Lateral_R','Unknown')),
  angle         float not null default 0,
  capture_type  text not null check (capture_type in ('regular','motion')),
  image_path    text,
  created_at    timestamptz not null default now()
);
create index if not exists posture_log_user_dt_idx on posture_log (user_id, datetime desc);
create index if not exists posture_log_posture_idx on posture_log (posture);


-- 2) 아침 컨디션 (기상 후 사용자가 직접 입력)
create table if not exists morning_conditions (
  id              bigserial primary key,
  user_id         text not null,
  date            date not null,
  refreshment     int check (refreshment between 1 and 5),
  pain_neck       boolean not null default false,
  pain_shoulder   boolean not null default false,
  pain_back       boolean not null default false,
  memo            text,
  created_at      timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists morning_conditions_user_date_idx on morning_conditions (user_id, date desc);


-- 3) Storage 버킷: sleep-images (Kinect 이미지 업로드용)
insert into storage.buckets (id, name, public)
values ('sleep-images', 'sleep-images', true)
on conflict (id) do nothing;

-- Storage 정책: 공개 읽기
drop policy if exists "Public read sleep-images" on storage.objects;
create policy "Public read sleep-images"
  on storage.objects for select
  using (bucket_id = 'sleep-images');

-- Storage 정책: anon key로 업로드 허용 (Kinect 사이드 호환)
drop policy if exists "Allow upload sleep-images" on storage.objects;
create policy "Allow upload sleep-images"
  on storage.objects for insert
  with check (bucket_id = 'sleep-images');


-- 3-B) 타임랩스 영상 (날짜별 mp4 Storage URL 저장)
create table if not exists timelapse_videos (
  id           bigserial primary key,
  user_id      text not null,
  date         date not null,
  url          text not null,
  duration_sec float,
  frame_count  int,
  created_at   timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists timelapse_videos_user_date_idx on timelapse_videos (user_id, date desc);
alter table timelapse_videos enable row level security;
drop policy if exists "demo all access timelapse_videos" on timelapse_videos;
create policy "demo all access timelapse_videos"
  on timelapse_videos for all using (true) with check (true);


-- 3-C) 기록 세션 제어 (웹 → Python 제어 신호)
create table if not exists recording_sessions (
  user_id     text primary key,
  status      text not null default 'idle'  -- 'idle' | 'recording' | 'paused'
              check (status in ('idle','recording','paused')),
  started_at  timestamptz,
  updated_at  timestamptz not null default now(),
  settings    jsonb not null default '{"interval_sec":300,"motion_thr":25,"motion_cooldown":300}'::jsonb
);
-- 기존 테이블에 컬럼 추가 (이미 존재하는 경우)
alter table recording_sessions
  add column if not exists settings jsonb not null
  default '{"interval_sec":300,"motion_thr":25,"motion_cooldown":300}'::jsonb;

alter table recording_sessions enable row level security;
drop policy if exists "demo all access recording_sessions" on recording_sessions;
create policy "demo all access recording_sessions"
  on recording_sessions for all using (true) with check (true);


-- 4) RLS (Row Level Security)
--    데모용으로 anon 키만 가지고도 읽기/쓰기 가능하게 열어둠.
--    실제 배포 시에는 auth.uid()::text = user_id 정책으로 좁혀야 함.
alter table posture_log         enable row level security;
alter table morning_conditions  enable row level security;

drop policy if exists "demo all access posture_log"        on posture_log;
drop policy if exists "demo all access morning_conditions" on morning_conditions;

create policy "demo all access posture_log"
  on posture_log for all using (true) with check (true);

create policy "demo all access morning_conditions"
  on morning_conditions for all using (true) with check (true);
