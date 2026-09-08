-- MySQL test seed for Timetable Calendar.
-- Run in a disposable/test database. Review the resolved IDs before COMMIT.

START TRANSACTION;

-- Resolve one coherent curriculum -> semester -> course -> section combination.
SET @academic_batch_id := NULL;
SET @semester_id := NULL;
SET @crs_id := NULL;
SET @section_id := NULL;
SET @topic_id := NULL;
SET @user_id := NULL;

SELECT c.academic_batch_id, s.semester_id, c.crs_id, sec.id
INTO @academic_batch_id, @semester_id, @crs_id, @section_id
FROM iems_courses c
JOIN iems_semester s
  ON s.academic_batch_id = c.academic_batch_id
 AND s.semester = c.semester
JOIN iems_section sec
  ON sec.academic_batch_id = c.academic_batch_id
 AND sec.semester_id = s.semester_id
ORDER BY c.crs_id DESC, s.semester_id DESC, sec.id DESC
LIMIT 1;

SELECT topic_id INTO @topic_id
FROM cudos_topic
WHERE academic_batch_id = @academic_batch_id
  AND semester_id = @semester_id
  AND course_id = @crs_id
ORDER BY topic_id DESC
LIMIT 1;

SELECT id INTO @user_id
FROM iems_users
ORDER BY id ASC
LIMIT 1;

SELECT crs_code INTO @crs_code FROM iems_courses WHERE crs_id = @crs_id LIMIT 1;
SELECT day_id INTO @day_id
FROM lms_tt_weekdays
WHERE LOWER(week_day_name) = 'monday' AND is_active = 1
ORDER BY days_order ASC
LIMIT 1;

-- First Monday of the current month and two following Mondays.
SET @month_start := DATE_FORMAT(CURDATE(), '%Y-%m-01');
SET @class_date_1 := DATE_ADD(@month_start, INTERVAL ((9 - DAYOFWEEK(@month_start)) % 7) DAY);
SET @class_date_2 := DATE_ADD(@class_date_1, INTERVAL 7 DAY);
SET @class_date_3 := DATE_ADD(@class_date_1, INTERVAL 14 DAY);

-- Inspect these values. Do not continue if a required ID is NULL.
SELECT
  @academic_batch_id AS academic_batch_id,
  @semester_id AS semester_id,
  @crs_id AS crs_id,
  @section_id AS section_id,
  @topic_id AS topic_id,
  @user_id AS user_id,
  @day_id AS day_id,
  @class_date_1 AS first_class_date;

INSERT INTO lms_tt_time_table_details
(
  academic_batch_id, semester_id, section_id,
  tt_start_date, tt_end_date, tt_start_time, tt_end_time,
  tt_time_slot_gap, lms_reg_byp_flag, created_by, created_date
)
VALUES
(
  @academic_batch_id, @semester_id, @section_id,
  DATE_FORMAT(@month_start, '%Y-%m-%d'),
  DATE_FORMAT(LAST_DAY(@month_start), '%Y-%m-%d'),
  '09:00:00', '10:00:00', '00:00:00', 0, @user_id, NOW()
);
SET @tt_detail_id := LAST_INSERT_ID();

INSERT INTO lms_tt_time_table
(
  tt_detail_id, day_id, week_day_name, crs_id, crs_code,
  class_start_time, class_end_time, extra_class_flag,
  bg_color, created_by, created_date
)
VALUES
(
  @tt_detail_id, @day_id, 'Monday', @crs_id, @crs_code,
  '09:00:00', '10:00:00', 0, '#dbeafe', @user_id, NOW()
);
SET @time_table_id := LAST_INSERT_ID();

INSERT INTO lms_tt_time_table_batch_map
(time_table_id, tt_detail_id, batch_id, crs_id, created_by, created_date)
VALUES
(@time_table_id, @tt_detail_id, @academic_batch_id, @crs_id, @user_id, NOW());

INSERT INTO lms_tt_time_table_day_mapping
(
  time_table_id, tt_detail_id, day_id, week_day_name, class_date,
  allot_crs_id, allot_by, extra_class_flag, created_by, created_date
)
VALUES
(@time_table_id, @tt_detail_id, @day_id, 'Monday', DATE_FORMAT(@class_date_1, '%Y-%m-%d'), @crs_id, @user_id, 0, @user_id, NOW()),
(@time_table_id, @tt_detail_id, @day_id, 'Monday', DATE_FORMAT(@class_date_2, '%Y-%m-%d'), @crs_id, @user_id, 0, @user_id, NOW()),
(@time_table_id, @tt_detail_id, @day_id, 'Monday', DATE_FORMAT(@class_date_3, '%Y-%m-%d'), @crs_id, @user_id, 0, @user_id, NOW());

-- Optional topic/instructor mapping when the selected course has a topic.
INSERT INTO lms_map_instructor_topic
(academic_batch_id, semester_id, crs_id, section_id, topic_id, instructor_id, created_by, created_date)
SELECT @academic_batch_id, @semester_id, @crs_id, @section_id, @topic_id, @user_id, @user_id, NOW()
WHERE @topic_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lms_map_instructor_topic
    WHERE academic_batch_id = @academic_batch_id
      AND semester_id = @semester_id
      AND crs_id = @crs_id
      AND section_id = @section_id
      AND topic_id = @topic_id
  );

-- Insert the lesson records expected by schedule_class.py.
-- This intentionally verifies that the physical table has the enriched columns
-- tt_day_map_id, time_table_id, tt_detail_id, topic_id, portion_ref,
-- portion_per_hour and video_link.
INSERT INTO lms_lesson_schedule
(
  tt_day_map_id, time_table_id, tt_detail_id,
  portion_ref, portion_per_hour,
  academic_batch_id, semester_id, crs_id, topic_id, section_id,
  plan_date, video_link, start_time, end_time,
  status, created_by, created_date
)
SELECT
  dm.tt_day_map_id, dm.time_table_id, dm.tt_detail_id,
  CONCAT('Calendar test portion ', DATE_FORMAT(dm.class_date, '%Y-%m-%d')), '1.0',
  @academic_batch_id, @semester_id, @crs_id, @topic_id, @section_id,
  DATE(dm.class_date), NULL, '09:00:00', '10:00:00',
  1, @user_id, NOW()
FROM lms_tt_time_table_day_mapping dm
WHERE dm.time_table_id = @time_table_id;

-- Verification: these rows match the joins used by schedule_class.py.
SELECT
  ls.lls_id, ls.plan_date, ls.start_time, ls.end_time,
  c.crs_code, c.crs_title, sec.section,
  t.topic_code, t.topic_title,
  dm.week_day_name, dm.allot_by,
  TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS faculty_name
FROM lms_lesson_schedule ls
LEFT JOIN iems_courses c ON c.crs_id = ls.crs_id
LEFT JOIN iems_section sec ON sec.id = ls.section_id
LEFT JOIN cudos_topic t ON t.topic_id = ls.topic_id
LEFT JOIN lms_tt_time_table_day_mapping dm ON dm.tt_day_map_id = ls.tt_day_map_id
LEFT JOIN iems_users u ON u.id = dm.allot_by
WHERE ls.tt_detail_id = @tt_detail_id
ORDER BY ls.plan_date, ls.start_time;

-- Use COMMIT after checking the result. Use ROLLBACK for a dry run.
-- COMMIT;
ROLLBACK;

