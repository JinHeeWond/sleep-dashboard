-- ===========================================================================
-- 2026-05-08 · 수면 점수 + 기상 컨디션 기능 제거
-- 사용법: Supabase 대시보드 → SQL Editor → New Query → 붙여넣고 RUN
-- ===========================================================================

-- 1) sleep_sessions.score 컬럼 제거
alter table sleep_sessions drop column if exists score;

-- 2) morning_conditions 테이블 제거 (정책은 cascade로 함께 정리)
drop policy if exists "demo all access morning_conditions" on morning_conditions;
drop table if exists morning_conditions;
