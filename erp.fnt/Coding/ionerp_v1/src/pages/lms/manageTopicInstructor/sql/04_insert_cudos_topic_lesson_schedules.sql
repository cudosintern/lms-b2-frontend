-- Populate lesson schedules from existing cudos_topic rows.
-- Run in your LMS database. Set the three context IDs below first.
-- One row per topic per session, using num_of_sessions (minimum 1).
-- Set @sessions_per_topic = 2, for example, to generate two for every topic.
-- Generated portions are placeholders: replace them with actual lesson content.
-- Existing schedules are preserved. Sequential reruns skip matching portion_ref.
-- Do not run concurrent copies: the supplied schema has no unique topic/portion key.

SET @academic_batch_id = NULL;
SET @semester_id = NULL;
SET @crs_id = NULL;
SET @sessions_per_topic = NULL; -- NULL uses each topic's num_of_sessions

-- Find the correct IDs and preview source topics before running the insert.
SELECT topic_id, topic_title, academic_batch_id, semester_id, crs_id,
       curriculum_id, term_id, course_id, num_of_sessions
FROM cudos_topic
WHERE academic_batch_id = @academic_batch_id
  AND semester_id = @semester_id AND crs_id = @crs_id
ORDER BY topic_id;

-- Supported session counts: 1 through 100. Fix any rows returned here first.
SELECT topic_id, topic_title, num_of_sessions, 'Invalid session count or missing required source IDs' AS issue
FROM cudos_topic
WHERE academic_batch_id = @academic_batch_id
  AND semester_id = @semester_id AND crs_id = @crs_id
  AND (COALESCE(@sessions_per_topic, NULLIF(num_of_sessions, 0), 1) NOT BETWEEN 1 AND 100
       OR curriculum_id IS NULL OR course_id IS NULL);

START TRANSACTION;

INSERT INTO cudos_topic_lesson_schedule (
    portion_ref, portion_per_hour,
    academic_batch_id, semester_id, crs_id, topic_id,
    created_by, modified_by, created_date, modified_date,
    conduction_date, actual_delivery_date,
    term_id, course_id, curriculum_id
)
SELECT
    CAST(n.session_number AS CHAR),
    LEFT(CONCAT(COALESCE(t.topic_title, 'Topic'), ' - Lesson ', n.session_number,
                ': Add lesson portion details.'), 2000),
    t.academic_batch_id, t.semester_id, t.crs_id, t.topic_id,
    t.created_by, NULL, CURDATE(), NULL,
    NULL, NULL,
    t.term_id, t.course_id, t.curriculum_id
FROM cudos_topic t
JOIN (
    SELECT tens.digit * 10 + units.digit + 1 AS session_number
    FROM (
        SELECT 0 AS digit UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
        UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
        UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
    ) tens
    CROSS JOIN (
        SELECT 0 AS digit UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
        UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
        UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
    ) units
) n ON n.session_number <= COALESCE(@sessions_per_topic, NULLIF(t.num_of_sessions, 0), 1)
WHERE t.academic_batch_id = @academic_batch_id
  AND t.semester_id = @semester_id AND t.crs_id = @crs_id
  AND t.curriculum_id IS NOT NULL AND t.course_id IS NOT NULL
  AND COALESCE(@sessions_per_topic, NULLIF(t.num_of_sessions, 0), 1) BETWEEN 1 AND 100
  AND NOT EXISTS (
      SELECT 1 FROM cudos_topic_lesson_schedule existing
      WHERE existing.topic_id = t.topic_id
        AND existing.academic_batch_id = t.academic_batch_id
        AND existing.semester_id = t.semester_id
        AND existing.crs_id = t.crs_id
        AND existing.portion_ref = CAST(n.session_number AS CHAR)
  );

SELECT ROW_COUNT() AS lesson_schedules_inserted;
COMMIT;

SELECT t.topic_id, t.topic_title, s.lesson_schedule_id,
       s.portion_ref, s.portion_per_hour, s.conduction_date
FROM cudos_topic t
JOIN cudos_topic_lesson_schedule s ON s.topic_id = t.topic_id
    AND s.academic_batch_id = t.academic_batch_id
    AND s.semester_id = t.semester_id AND s.crs_id = t.crs_id
WHERE t.academic_batch_id = @academic_batch_id
  AND t.semester_id = @semester_id AND t.crs_id = @crs_id
ORDER BY t.topic_id, CAST(s.portion_ref AS UNSIGNED), s.lesson_schedule_id;
