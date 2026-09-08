-- MySQL / MariaDB: run in your LMS database.
-- Replace the NULL ID placeholders using 01_find_topic_context.sql.
-- Replace the five sample topics below with your actual syllabus.
-- This inserts into cudos_topic ONLY. It does not assign instructors.

SET @academic_batch_id = NULL; -- selected academic batch ID
SET @semester_id       = NULL; -- semester_id, not the displayed semester number
SET @crs_id            = NULL; -- selected course ID
SET @section_id        = NULL; -- used to validate visibility in Import Topics
SET @created_by        = NULL; -- your existing staff user ID
SET @category_id       = NULL; -- theory: NULL, lab/subsection: correct positive category ID

-- A valid course/section must have an existing course instructor.
-- Topics belong to the course, not to a section. @section_id is not stored in cudos_topic.
SET @valid_context = EXISTS (
    SELECT 1
    FROM iems_courses c
    JOIN iems_semester s ON s.semester_id = @semester_id
                           AND s.academic_batch_id = c.academic_batch_id
                           AND s.semester = c.semester
    JOIN iems_academic_batch b ON b.academic_batch_id = c.academic_batch_id
    JOIN cudos_map_courseto_course_instructor m
      ON m.crs_id = c.crs_id AND m.academic_batch_id = b.academic_batch_id
     AND m.semester_id = s.semester_id AND m.section_id = @section_id
    JOIN iems_users instructor ON instructor.id = m.course_instructor_id
    JOIN cudos_master_type_details sec ON sec.mt_details_id = m.section_id
    JOIN iems_users creator ON creator.id = @created_by
    WHERE c.crs_id = @crs_id AND b.academic_batch_id = @academic_batch_id
      AND ((COALESCE(sec.parent_id, 0) = 0 AND @category_id IS NULL)
        OR (sec.parent_id > 0 AND @category_id > 0))
);

SELECT CASE WHEN @valid_context = 1 THEN 'READY: inserting missing topic codes'
       ELSE 'NOT INSERTED: set valid batch, semester, course, section, staff and category IDs'
       END AS validation;

START TRANSACTION;

-- Legacy columns remain NOT NULL in your live DB, so populate both sets.
-- Sequential reruns skip a code already present in this batch/semester/course.
-- Existing topics are not overwritten. Do not run concurrent copies of this script.
INSERT INTO cudos_topic (
    topic_code, topic_title, topic_content, topic_hrs, num_of_sessions,
    marks_expt, category_id,
    academic_batch_id, semester_id, crs_id,
    curriculum_id, term_id, course_id,
    state_id, created_by, created_date, modified_by, modified_date
)
SELECT
    seed.topic_code, seed.topic_title, seed.topic_content,
    seed.topic_hrs, seed.num_of_sessions, seed.marks_expt, @category_id,
    @academic_batch_id, @semester_id, @crs_id,
    @academic_batch_id, @semester_id, @crs_id,
    1, @created_by, CURDATE(), @created_by, CURDATE()
FROM (
    SELECT 'TOP001' AS topic_code,
           'Introduction and Overview' AS topic_title,
           'Course overview, learning objectives and introductory concepts.' AS topic_content,
           '2' AS topic_hrs, 2 AS num_of_sessions, 5 AS marks_expt
    UNION ALL
    SELECT 'TOP002', 'Fundamental Concepts',
           'Key definitions, foundational principles and worked examples.', '3', 3, 10
    UNION ALL
    SELECT 'TOP003', 'Methods and Techniques',
           'Core methods, step-by-step techniques and guided practice.', '3', 3, 10
    UNION ALL
    SELECT 'TOP004', 'Applications and Problem Solving',
           'Practical applications, case studies and problem-solving exercises.', '4', 4, 15
    UNION ALL
    SELECT 'TOP005', 'Revision and Assessment Preparation',
           'Review of learning outcomes, practice questions and discussion.', '2', 2, 5
) AS seed
WHERE @valid_context = 1
  AND NOT EXISTS (
      SELECT 1 FROM cudos_topic existing
      WHERE existing.academic_batch_id = @academic_batch_id
        AND existing.semester_id = @semester_id
        AND existing.crs_id = @crs_id
        AND existing.topic_code = seed.topic_code
  );

SELECT ROW_COUNT() AS topics_inserted;
COMMIT;

-- Verify source topics and assignment status for the selected section.
SELECT t.topic_id, t.topic_code, t.topic_title, t.topic_hrs, t.num_of_sessions,
       t.academic_batch_id, t.semester_id, t.crs_id, t.category_id,
       CASE WHEN EXISTS (
           SELECT 1 FROM lms_map_instructor_topic mit
           WHERE mit.topic_id = t.topic_id
             AND mit.academic_batch_id = t.academic_batch_id
             AND mit.semester_id = t.semester_id AND mit.crs_id = t.crs_id
             AND mit.section_id = @section_id
       ) THEN 'Already assigned in this section'
         ELSE 'Ready to assign using Import Topics' END AS import_status
FROM cudos_topic t
WHERE t.academic_batch_id = @academic_batch_id
  AND t.semester_id = @semester_id AND t.crs_id = @crs_id
  AND t.topic_code IN ('TOP001', 'TOP002', 'TOP003', 'TOP004', 'TOP005')
ORDER BY t.topic_id;

-- Next: Manage Topic Instructor > same batch, semester, course, section
-- > Import Topics > select instructor(s) > Save assignments.
-- The API reads cudos_topic and creates lms_map_instructor_topic mappings
-- and section-specific lms_map_portion_ls records.
