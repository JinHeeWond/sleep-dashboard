-- =============================================================
-- SleepLab 더미 데이터 — posture_log 7일치 (하루 ~100개)
-- Supabase SQL Editor에서 실행하세요
--
-- ⚠️  실행 전: USER_ID 를 본인 UUID로 교체하세요
--     Supabase 대시보드 → Authentication → Users → 본인 행 → User UID 복사
-- =============================================================

DO $$
DECLARE
    v_user_id       TEXT    := 'fc831d60-12cf-4a49-87ec-dda05a3630af'; -- ← 본인 UUID로 교체
    v_day           INT;
    v_i             INT;
    v_dt            TIMESTAMPTZ;
    v_ts            BIGINT;
    v_posture       TEXT;
    v_angle         FLOAT;
    v_kind          TEXT;
    v_block_posture TEXT;
    v_postures      TEXT[] := ARRAY[
        'Supine','Supine','Supine','Supine','Supine','Supine','Supine',   -- 35%
        'Lateral_L','Lateral_L','Lateral_L','Lateral_L','Lateral_L','Lateral_L', -- 30%
        'Lateral_R','Lateral_R','Lateral_R','Lateral_R','Lateral_R',     -- 25%
        'Prone','Prone',                                                   -- 10%
        'Unknown'                                                          --  5%
    ];
BEGIN
    FOR v_day IN REVERSE 7 .. 1 LOOP

        -- 날마다 초기 자세 블록 설정
        v_block_posture := v_postures[(floor(random() * array_length(v_postures, 1)) + 1)::INT];

        FOR v_i IN 0 .. 99 LOOP

            -- 수면 시간: 전날 23:00 ~ 익일 07:00 (8시간 = 28800초 / 100개 = 288초 간격)
            v_dt := date_trunc('day', CURRENT_DATE - (v_day || ' days')::INTERVAL)
                    + INTERVAL '23 hours'
                    + (v_i * 288 || ' seconds')::INTERVAL;
            v_ts := EXTRACT(EPOCH FROM v_dt)::BIGINT;

            -- 15개마다 자세 블록 전환 (현실적으로 수면 중 자세는 일정 시간 유지)
            IF v_i % 15 = 0 THEN
                v_block_posture := v_postures[(floor(random() * array_length(v_postures, 1)) + 1)::INT];
            END IF;

            -- 10% 확률로 블록 내 이탈 (뒤척임)
            IF random() < 0.1 THEN
                v_posture := v_postures[(floor(random() * array_length(v_postures, 1)) + 1)::INT];
            ELSE
                v_posture := v_block_posture;
            END IF;

            -- 자세별 angle 범위 (Kinect 기준 현실적인 값)
            v_angle := CASE v_posture
                WHEN 'Supine'    THEN round((random() * 10 + 80)::NUMERIC, 1)  -- 80~90°
                WHEN 'Prone'     THEN round((random() * 10 + 75)::NUMERIC, 1)  -- 75~85°
                WHEN 'Lateral_L' THEN round((random() * 15 + 20)::NUMERIC, 1) -- 20~35°
                WHEN 'Lateral_R' THEN round((random() * 15 + 20)::NUMERIC, 1) -- 20~35°
                ELSE                  round((random() * 50 + 20)::NUMERIC, 1)
            END;

            -- 85% regular, 15% motion
            v_kind := CASE WHEN random() < 0.85 THEN 'regular' ELSE 'motion' END;

            INSERT INTO posture_log (user_id, timestamp, datetime, posture, angle, capture_type, image_path)
            VALUES (v_user_id, v_ts, v_dt, v_posture, v_angle, v_kind, NULL);

        END LOOP;
    END LOOP;

    RAISE NOTICE '✅ 더미 데이터 삽입 완료 — 7일 × 100개 = 700개';
END $$;
