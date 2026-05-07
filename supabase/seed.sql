-- 선택: 샘플 데이터 한 번 넣어보기
-- (mock 데이터로 이미 작동하니 필수는 아님. Supabase 연결 테스트용)

insert into morning_conditions (user_id, date, refreshment, pain_neck, pain_back, pain_shoulder, notes)
values ('demo', current_date, 4, false, false, true, '오른쪽 어깨가 약간 뻐근')
on conflict (user_id, date) do update
  set refreshment = excluded.refreshment,
      pain_neck = excluded.pain_neck,
      pain_back = excluded.pain_back,
      pain_shoulder = excluded.pain_shoulder,
      notes = excluded.notes;

insert into sleep_sessions
  (user_id, date, start_time, end_time, duration_min, score, motion_count, regular_count)
values
  ('demo', current_date,
   (current_date - interval '1 day' + time '23:30')::timestamptz,
   (current_date + time '07:00')::timestamptz,
   450, 78, 14, 450)
on conflict (user_id, date) do update
  set score = excluded.score,
      motion_count = excluded.motion_count,
      regular_count = excluded.regular_count;
