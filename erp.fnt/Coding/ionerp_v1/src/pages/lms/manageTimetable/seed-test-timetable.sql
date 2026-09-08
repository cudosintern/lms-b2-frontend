-- MySQL seed data for testing the timetable/calendar module.
--
-- Update the five values below with IDs that exist in your database. The
-- selected course must be available for the selected curriculum/semester and
-- section, otherwise it may not appear in the timetable UI.
--
-- This script only INSERTs records. Run it inside a transaction first and
-- COMMIT only after verifying the final SELECT statements.

START TRANSACTION;

SET @academic_batch_id = 1;
SET @semester_id = 1;
SET @section_id = 1;
SET @created_by = 1;
SET @course_id = 1;

-- Resolve the course code and weekday IDs from existing master data.
SET @course_code = (
  SELECT crs_code
  FROM course
  WHERE crs_id = @course_id
  LIMIT 1
);

SET @tuesday_day_id = (
  SELECT day_id
  FROM lms_week_days
  WHERE week_day_name = 'Tuesday'
  LIMIT 1
);

SET @thursday_day_id = (
  SELECT day_id
  FROM lms_week_days
  WHERE week_day_name = 'Thursday'
  LIMIT 1
);

-- The dates are deliberately near the current test period. Change them if
-- your calendar is filtered to another period. Date values follow the module's
-- DD-MM-YYYY format.
INSERT INTO lms_tt_time_table_details (
  crclm_id,
  crclm_term_id,
  section_id,
  tt_start_date,
  tt_end_date,
  tt_start_time,
  tt_end_time,
  tt_time_slot_gap,
  lms_reg_byp_flag,
  created_by,
  modified_by,
  created_date,
  modified_date
) VALUES (
  @academic_batch_id,
  @semester_id,
  @section_id,
  '01-09-2026',
  '14-09-2026',
  '09:00 AM',
  '12:00 PM',
  5,
  0,
  @created_by,
  @created_by,
  NOW(),
  NOW()
);

SET @tt_detail_id = LAST_INSERT_ID();

-- Tuesday class: 09:00 AM–10:00 AM
INSERT INTO lms_tt_time_table (
  tt_detail_id,
  day_id,
  week_day_name,
  crs_id,
  crs_code,
  class_start_time,
  class_end_time,
  created_by,
  modified_by,
  created_date,
  modified_date
) VALUES (
  @tt_detail_id,
  @tuesday_day_id,
  'Tuesday',
  @course_id,
  @course_code,
  '09:00 AM',
  '10:00 AM',
  @created_by,
  @created_by,
  NOW(),
  NOW()
);

SET @tuesday_class_id = LAST_INSERT_ID();

-- Thursday class: 10:15 AM–11:15 AM
INSERT INTO lms_tt_time_table (
  tt_detail_id,
  day_id,
  week_day_name,
  crs_id,
  crs_code,
  class_start_time,
  class_end_time,
  created_by,
  modified_by,
  created_date,
  modified_date
) VALUES (
  @tt_detail_id,
  @thursday_day_id,
  'Thursday',
  @course_id,
  @course_code,
  '10:15 AM',
  '11:15 AM',
  @created_by,
  @created_by,
  NOW(),
  NOW()
);

SET @thursday_class_id = LAST_INSERT_ID();

-- Calendar/event data: one mapping for each occurrence of the two classes.
INSERT INTO lms_tt_time_table_day_mapping (
  time_table_id,
  tt_detail_id,
  day_id,
  week_day_name,
  class_date,
  created_by,
  created_date
) VALUES
  (@tuesday_class_id, @tt_detail_id, @tuesday_day_id, 'Tuesday', '01-09-2026', @created_by, NOW()),
  (@thursday_class_id, @tt_detail_id, @thursday_day_id, 'Thursday', '03-09-2026', @created_by, NOW()),
  (@tuesday_class_id, @tt_detail_id, @tuesday_day_id, 'Tuesday', '08-09-2026', @created_by, NOW()),
  (@thursday_class_id, @tt_detail_id, @thursday_day_id, 'Thursday', '10-09-2026', @created_by, NOW());

-- Verify the timetable and its calendar entries before committing.
SELECT *
FROM lms_tt_time_table_details
WHERE tt_detail_id = @tt_detail_id;

SELECT *
FROM lms_tt_time_table
WHERE tt_detail_id = @tt_detail_id;

SELECT *
FROM lms_tt_time_table_day_mapping
WHERE tt_detail_id = @tt_detail_id
ORDER BY class_date, time_table_id;

-- Replace ROLLBACK with COMMIT after confirming the records are correct.
ROLLBACK;
