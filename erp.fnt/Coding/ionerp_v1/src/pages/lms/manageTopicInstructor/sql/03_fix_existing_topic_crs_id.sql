-- Correct missing crs_id values for the 13 topics shown in your screenshot.
-- Database verified: erp_05_aug26. This script has NOT been executed.
-- IMPORTANT: do not copy course_id to crs_id blindly:
-- legacy course_id=901 is Yoga in iems_courses, not Data Structures.
-- There is no Data Structures course in academic batch 1 / semester 4.

SET @data_structures_crs_id = NULL; -- REQUIRED: choose the intended course in batch 1, semester 4
SET @dbms_crs_id = 893;             -- verified: BCS403 - Database Management Systems

-- Review available targets first.
SELECT crs_id, crs_code, crs_title, academic_batch_id, semester
FROM iems_courses
WHERE academic_batch_id = 1 AND semester = 4
ORDER BY crs_id;

-- Preview. A NULL proposed_crs_id means that group will not be updated.
SELECT topic_id, topic_code, topic_title, crs_id AS current_crs_id,
       course_id AS legacy_course_id,
       CASE WHEN topic_id IN (101,102,103,104,105,106,107,504)
            THEN @data_structures_crs_id ELSE @dbms_crs_id END AS proposed_crs_id
FROM cudos_topic
WHERE academic_batch_id = 1 AND semester_id = 4
  AND topic_id IN (101,102,103,104,105,106,107,504,201,202,203,204,505)
  AND (crs_id IS NULL OR crs_id = 0);

START TRANSACTION;

UPDATE cudos_topic t
JOIN iems_semester s ON s.semester_id = t.semester_id
                       AND s.academic_batch_id = t.academic_batch_id
JOIN iems_courses c ON c.crs_id = @data_structures_crs_id
                      AND c.academic_batch_id = t.academic_batch_id
                      AND c.semester = s.semester
SET t.crs_id = c.crs_id, t.modified_date = CURDATE()
WHERE t.academic_batch_id = 1 AND t.semester_id = 4
  AND t.topic_id IN (101,102,103,104,105,106,107,504)
  AND t.course_id = 901 AND t.topic_code LIKE 'DS%'
  AND (t.crs_id IS NULL OR t.crs_id = 0);
SELECT ROW_COUNT() AS data_structures_topics_updated;

UPDATE cudos_topic t
JOIN iems_semester s ON s.semester_id = t.semester_id
                       AND s.academic_batch_id = t.academic_batch_id
JOIN iems_courses c ON c.crs_id = @dbms_crs_id
                      AND c.academic_batch_id = t.academic_batch_id
                      AND c.semester = s.semester
SET t.crs_id = c.crs_id, t.modified_date = CURDATE()
WHERE t.academic_batch_id = 1 AND t.semester_id = 4
  AND t.topic_id IN (201,202,203,204,505)
  AND t.course_id = 902 AND t.topic_code LIKE 'DBMS%'
  AND (t.crs_id IS NULL OR t.crs_id = 0);
SELECT ROW_COUNT() AS dbms_topics_updated;

COMMIT;

SELECT topic_id, topic_code, topic_title, academic_batch_id, semester_id, crs_id
FROM cudos_topic
WHERE academic_batch_id = 1 AND semester_id = 4
  AND topic_id IN (101,102,103,104,105,106,107,504,201,202,203,204,505)
ORDER BY topic_id;

-- After correction, select this academic batch, semester, course and a mapped
-- section in Manage Topic Instructor, then click Import Topics.
-- Existing nonzero crs_id values and legacy course_id values are preserved.
