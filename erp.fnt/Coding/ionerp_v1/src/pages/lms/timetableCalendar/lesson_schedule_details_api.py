"""Standalone FastAPI endpoint equivalent to CodeIgniter get_ls_details().

Copy the schema, helpers, and route into schedule_class.py. The router in that
module is already registered by routes.py.
"""

from datetime import date, datetime
from typing import Optional

from fastapi import Depends
from pydantic import BaseModel, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.utils.auth_helper import get_current_user
from app.utils.http_return_helper import returnException, returnSuccess


class LessonScheduleDetailsRequest(BaseModel):
    academic_batch_id: int
    semester_id: int
    crs_id: int
    section_id: int
    plan_date: date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    lls_id: Optional[int] = None
    tt_day_map_id: Optional[int] = None

    @field_validator("plan_date", mode="before")
    @classmethod
    def parse_plan_date(cls, value):
        if isinstance(value, date):
            return value
        value = str(value).strip()
        for date_format in ("%Y-%m-%d", "%d-%m-%Y"):
            try:
                return datetime.strptime(value[:10], date_format).date()
            except ValueError:
                continue
        raise ValueError("plan_date must use YYYY-MM-DD or DD-MM-YYYY")


def _table_columns(db: Session, table_name: str) -> set[str]:
    rows = db.execute(
        text(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = :table_name
            """
        ),
        {"table_name": table_name},
    ).fetchall()
    return {row[0] for row in rows}


def _time_text(value) -> Optional[str]:
    return None if value is None else str(value)[:8]


@router.post("/lesson-schedule-details")
def get_lesson_schedule_details(
    request: LessonScheduleDetailsRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all data needed by the Add Lesson Schedule modal."""

    try:
        user_id = current_user.get("user_id") or current_user.get("id") or 0
        params = {
            "academic_batch_id": request.academic_batch_id,
            "semester_id": request.semester_id,
            "crs_id": request.crs_id,
            "section_id": request.section_id,
            "plan_date": request.plan_date,
            "start_time": request.start_time,
            "end_time": request.end_time,
            "lls_id": request.lls_id,
            "tt_day_map_id": request.tt_day_map_id,
            "user_id": user_id,
        }

        course = db.execute(
            text(
                """
                SELECT crs_id, crs_code, crs_title
                FROM iems_courses
                WHERE crs_id = :crs_id
                LIMIT 1
                """
            ),
            params,
        ).mappings().first()
        if not course:
            return returnException("Course not found")

        section = db.execute(
            text(
                """
                SELECT mt_details_id AS section_id, mt_details_name AS section_name, parent_id
                FROM cudos_master_type_details
                WHERE mt_details_id = :section_id
                LIMIT 1
                """
            ),
            params,
        ).mappings().first()

        topics = db.execute(
            text(
                """
                SELECT DISTINCT t.topic_id, t.topic_code, t.topic_title
                FROM cudos_topic t
                LEFT JOIN lms_map_instructor_topic mit
                  ON mit.topic_id = t.topic_id
                 AND mit.academic_batch_id = :academic_batch_id
                 AND mit.semester_id = :semester_id
                 AND mit.crs_id = :crs_id
                 AND mit.section_id = :section_id
                WHERE t.academic_batch_id = :academic_batch_id
                  AND t.semester_id = :semester_id
                  AND t.crs_id = :crs_id
                  AND (mit.instructor_id IS NULL OR mit.instructor_id = :user_id)
                ORDER BY t.topic_id
                """
            ),
            params,
        ).mappings().all()

        lls_columns = _table_columns(db, "lms_lesson_schedule")
        optional_columns = [
            name for name in (
                "topic_id", "portion_ref", "portion_per_hour", "video_link",
                "tt_day_map_id", "time_table_id", "tt_detail_id",
            ) if name in lls_columns
        ]
        select_columns = ", ".join(["lls_id", "status"] + optional_columns)
        lesson_conditions = [
            "academic_batch_id = :academic_batch_id",
            "semester_id = :semester_id",
            "crs_id = :crs_id",
            "section_id = :section_id",
            "plan_date = :plan_date",
        ]
        if request.lls_id:
            lesson_conditions = ["lls_id = :lls_id"]
        elif request.start_time:
            lesson_conditions.append("LEFT(start_time, 5) = LEFT(:start_time, 5)")
        if request.end_time and not request.lls_id:
            lesson_conditions.append("LEFT(end_time, 5) = LEFT(:end_time, 5)")

        lesson = db.execute(
            text(
                f"SELECT {select_columns} FROM lms_lesson_schedule "
                f"WHERE {' AND '.join(lesson_conditions)} ORDER BY lls_id DESC LIMIT 1"
            ),
            params,
        ).mappings().first()
        lesson_data = dict(lesson) if lesson else {}

        selected_topic_id = lesson_data.get("topic_id")
        portions = []
        if selected_topic_id:
            portions = db.execute(
                text(
                    """
                    SELECT mtp_id AS portion_id, topic_id, lesson_schedule_id,
                           portion_ref, portion_per_hour, planned_date,
                           delivery_date, start_time, end_time, status
                    FROM lms_map_portion_ls
                    WHERE topic_id = :topic_id
                      AND (section_id IS NULL OR section_id = :section_id)
                    ORDER BY planned_date, mtp_id
                    """
                ),
                {**params, "topic_id": selected_topic_id},
            ).mappings().all()

        delivery_methods = []
        if selected_topic_id:
            delivery_methods = db.execute(
                text(
                    """
                    SELECT DISTINCT dm.delivery_mtd_id, dm.delivery_mtd_name,
                           dm.delivery_mtd_desc
                    FROM cudos_topic_delivery_method tdm
                    JOIN cudos_delivery_method dm
                      ON dm.delivery_mtd_id = tdm.delivery_mtd_id
                    WHERE tdm.topic_id = :topic_id
                    ORDER BY dm.delivery_mtd_name
                    """
                ),
                {"topic_id": selected_topic_id},
            ).mappings().all()

        bloom_levels = db.execute(
            text(
                """
                SELECT bloom_id, bld_id, level, learning, description
                FROM cudos_bloom_level
                ORDER BY bld_id, bloom_id
                """
            )
        ).mappings().all()

        course_list = db.execute(
            text(
                """
                SELECT DISTINCT c.crs_id, c.crs_code, c.crs_title
                FROM cudos_map_courseto_course_instructor m
                JOIN iems_courses c ON c.crs_id = m.crs_id
                WHERE m.academic_batch_id = :academic_batch_id
                  AND m.semester_id = :semester_id
                  AND m.section_id = :section_id
                ORDER BY c.crs_code
                """
            ),
            params,
        ).mappings().all()

        notifications = db.execute(
            text(
                """
                SELECT lmsn_id AS notification_id, notify_description AS description,
                       delivery_date, delivery_time
                FROM lms_notifications
                WHERE created_by = :user_id
                  AND display_to_timetable = 1
                  AND delivery_date = :plan_date
                ORDER BY lmsn_id DESC
                """
            ),
            params,
        ).mappings().all()

        data = {
            "course": dict(course),
            "section": None if not section else dict(section),
            "course_list": [dict(row) for row in course_list],
            "topic_list": [dict(row) for row in topics],
            "portion_list": [
                {**dict(row), "start_time": _time_text(row["start_time"]), "end_time": _time_text(row["end_time"])}
                for row in portions
            ],
            "delivery_method_list": [dict(row) for row in delivery_methods],
            "bloom_level_list": [dict(row) for row in bloom_levels],
            "lesson_schedule": lesson_data or None,
            "notification_count": len(notifications),
            "notifications": [dict(row) for row in notifications],
            "video_link": lesson_data.get("video_link") or "",
            "status": lesson_data.get("status", 0),
            "data_status": 1 if lesson_data else 0,
            "delete_schedule_class": bool(lesson_data),
            "delete_comments_class": False,
            "lms_topic_import_type_flag": 1,
        }
        return returnSuccess(data)

    except Exception as exc:
        db.rollback()
        return returnException(f"Failed to load lesson schedule details: {str(exc)}")
