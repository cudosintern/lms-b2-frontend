-- Run this first in your LMS database to choose matching IDs.
-- Use one row's batch, semester, course and section together.
SELECT DISTINCT
    b.academic_batch_id,
    b.academic_batch_desc,
    s.semester_id,
    s.semester,
    c.crs_id,
    c.crs_code,
    c.crs_title,
    sec.mt_details_id AS section_id,
    sec.mt_details_name AS section_name,
    sec.parent_id,
    CASE WHEN COALESCE(sec.parent_id, 0) = 0
         THEN 'Theory: use NULL category_id'
         ELSE 'Lab/subsection: use the correct positive topic category_id'
    END AS topic_category_requirement,
    m.course_instructor_id AS available_instructor_id
FROM cudos_map_courseto_course_instructor m
JOIN iems_academic_batch b ON b.academic_batch_id = m.academic_batch_id
JOIN iems_semester s ON s.semester_id = m.semester_id
                       AND s.academic_batch_id = b.academic_batch_id
JOIN iems_courses c ON c.crs_id = m.crs_id
                      AND c.academic_batch_id = b.academic_batch_id
                      AND c.semester = s.semester
JOIN cudos_master_type_details sec ON sec.mt_details_id = m.section_id
JOIN iems_users u ON u.id = m.course_instructor_id
ORDER BY b.academic_batch_id, s.semester_id, c.crs_id, sec.mt_details_id;

-- Existing topic categories, if you need to identify the category for a lab course.
SELECT DISTINCT academic_batch_id, semester_id, crs_id, category_id
FROM cudos_topic
WHERE category_id > 0
ORDER BY academic_batch_id, semester_id, crs_id, category_id;
