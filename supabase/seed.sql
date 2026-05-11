-- 선택: 샘플 데이터 한 번 넣어보기
-- (mock 데이터로 이미 작동하니 필수는 아님. Supabase 연결 테스트용)

insert into sleep_sessions
  (user_id, date, start_time, end_time, duration_min, motion_count, regular_count)
values
  ('demo', current_date,
   (current_date - interval '1 day' + time '23:30')::timestamptz,
   (current_date + time '07:00')::timestamptz,
   450, 14, 450)
on conflict (user_id, date) do update
  set motion_count = excluded.motion_count,
      regular_count = excluded.regular_count;
