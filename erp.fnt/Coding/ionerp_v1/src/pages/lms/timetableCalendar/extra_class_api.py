"""Standalone FastAPI router for legacy save_extra_class functionality."""

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, field_validator, model_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.utils.auth_helper import get_current_user
from app.utils.http_return_helper import returnException, returnSuccess

router = APIRouter(prefix="/tt-calendar", tags=["TT Calendar"])


class ExtraClassRequest(BaseModel):
    academic_batch_id: int
    semester_id: int
    crs_id: int
    section_id: int
    extra_class_date: date
    start_time: str
    end_time: str
    tt_detail_id: Optional[int] = None
    time_table_id: Optional[int] = None
    tt_day_map_id: Optional[int] = None
    lls_id: Optional[int] = None

    @field_validator("extra_class_date", mode="before")
    @classmethod
    def parse_class_date(cls, value):
        if isinstance(value, date):
            return value
        for date_format in ("%Y-%m-%d", "%d-%m-%Y"):
            try:
                return datetime.strptime(str(value)[:10], date_format).date()
            except ValueError:
                continue
        raise ValueError("extra_class_date must use YYYY-MM-DD or DD-MM-YYYY")

    @model_validator(mode="after")
    def validate_times(self):
        try:
            start = datetime.strptime(self.start_time[:5], "%H:%M").time()
            end = datetime.strptime(self.end_time[:5], "%H:%M").time()
        except ValueError as exc:
            raise ValueError("start_time and end_time must use HH:MM") from exc
        if start >= end:
            raise ValueError("end_time must be later than start_time")
        return self


@router.post("/extra-class")
def save_extra_class(
    request: ExtraClassRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update an extra class after checking date/time overlap."""

    try:
        user_id = current_user.get("user_id") or current_user.get("id") or 0
        class_date_db = request.extra_class_date.strftime("%d-%m-%Y")
        weekday_name = request.extra_class_date.strftime("%A")
        start_time = request.start_time[:5]
        end_time = request.end_time[:5]
        params = {
            "academic_batch_id": request.academic_batch_id,
            "semester_id": request.semester_id,
            "crs_id": request.crs_id,
            "section_id": request.section_id,
            "class_date": request.extra_class_date,
            "start_time": start_time,
            "end_time": end_time,
            "time_table_id": request.time_table_id,
        }

        overlap = db.execute(
            text(
                """
                SELECT tt.time_table_id, tt.crs_id, tt.crs_code,
                       c.crs_title, tt.week_day_name,
                       tt.class_start_time, tt.class_end_time
                FROM lms_tt_time_table_day_mapping dm
                JOIN lms_tt_time_table tt ON tt.time_table_id = dm.time_table_id
                JOIN lms_tt_time_table_details td ON td.tt_detail_id = tt.tt_detail_id
                LEFT JOIN iems_courses c ON c.crs_id = tt.crs_id
                WHERE td.academic_batch_id = :academic_batch_id
                  AND td.semester_id = :semester_id
                  AND td.section_id = :section_id
                  AND tt.crs_id = :crs_id
                  AND COALESCE(
                        STR_TO_DATE(dm.class_date, '%d-%m-%Y'),
                        STR_TO_DATE(dm.class_date, '%Y-%m-%d')
                      ) = :class_date
                  AND (:time_table_id IS NULL OR tt.time_table_id <> :time_table_id)
                  AND TIME(tt.class_start_time) < TIME(:end_time)
                  AND TIME(tt.class_end_time) > TIME(:start_time)
                ORDER BY tt.class_start_time
                LIMIT 1
                """
            ),
            params,
        ).mappings().first()

        if overlap:
            return returnException(
                "Class overlapped on "
                f"{overlap['week_day_name']} with course - "
                f"{overlap['crs_code']} {overlap['crs_title'] or ''} at "
                f"{overlap['class_start_time']}-{overlap['class_end_time']}."
            )

        course = db.execute(
            text("SELECT crs_id, crs_code FROM iems_courses WHERE crs_id = :crs_id LIMIT 1"),
            params,
        ).mappings().first()
        if not course:
            return returnException("Course not found")

        day_id = db.execute(
            text("SELECT day_id FROM lms_tt_weekdays WHERE week_day_name = :weekday LIMIT 1"),
            {"weekday": weekday_name},
        ).scalar()
        if day_id is None:
            return returnException(f"Weekday configuration not found for {weekday_name}")

        tt_detail_id = request.tt_detail_id
        if not tt_detail_id:
            tt_detail_id = db.execute(
                text(
                    """
                    SELECT tt_detail_id
                    FROM lms_tt_time_table_details
                    WHERE academic_batch_id = :academic_batch_id
                      AND semester_id = :semester_id
                      AND section_id = :section_id
                    ORDER BY tt_detail_id DESC
                    LIMIT 1
                    """
                ),
                params,
            ).scalar()
        if not tt_detail_id:
            return returnException("Timetable details not found for the selected filters")

        now = datetime.now()
        if request.time_table_id:
            db.execute(
                text(
                    """
                    UPDATE lms_tt_time_table
                    SET day_id=:day_id, week_day_name=:weekday,
                        class_start_time=:start_time, class_end_time=:end_time,
                        modified_by=:user_id, modified_date=:now
                    WHERE time_table_id=:time_table_id
                    """
                ),
                {**params, "day_id": day_id, "weekday": weekday_name, "user_id": user_id, "now": now},
            )
            if not request.tt_day_map_id:
                return returnException("tt_day_map_id is required while updating an extra class")
            db.execute(
                text(
                    """
                    UPDATE lms_tt_time_table_day_mapping
                    SET day_id=:day_id, week_day_name=:weekday, class_date=:class_date_db,
                        modified_by=:user_id, modified_date=:now
                    WHERE tt_day_map_id=:tt_day_map_id
                    """
                ),
                {"day_id": day_id, "weekday": weekday_name, "class_date_db": class_date_db,
                 "user_id": user_id, "now": now, "tt_day_map_id": request.tt_day_map_id},
            )
            if request.lls_id:
                db.execute(
                    text(
                        """
                        UPDATE lms_lesson_schedule
                        SET plan_date=:plan_date, start_time=:start_time, end_time=:end_time,
                            modified_by=:user_id, modified_date=:now
                        WHERE lls_id=:lls_id
                        """
                    ),
                    {"plan_date": request.extra_class_date, "start_time": start_time, "end_time": end_time,
                     "user_id": user_id, "now": now, "lls_id": request.lls_id},
                )
            message = "Extra class updated successfully."
            time_table_id = request.time_table_id
            tt_day_map_id = request.tt_day_map_id
        else:
            result = db.execute(
                text(
                    """
                    INSERT INTO lms_tt_time_table
                    (tt_detail_id, day_id, week_day_name, crs_id, crs_code,
                     class_start_time, class_end_time, extra_class_flag,
                     extra_class_created, created_by, modified_by, created_date, modified_date)
                    VALUES
                    (:tt_detail_id, :day_id, :weekday, :crs_id, :crs_code,
                     :start_time, :end_time, 1, :user_id, :user_id, :user_id, :now, :now)
                    """
                ),
                {**params, "tt_detail_id": tt_detail_id, "day_id": day_id, "weekday": weekday_name,
                 "crs_code": course["crs_code"], "user_id": user_id, "now": now},
            )
            time_table_id = result.lastrowid

            parent_id = db.execute(
                text("SELECT parent_id FROM cudos_master_type_details WHERE mt_details_id=:section_id LIMIT 1"),
                params,
            ).scalar()
            if parent_id:
                db.execute(
                    text(
                        """
                        INSERT INTO lms_tt_time_table_batch_map
                        (time_table_id, tt_detail_id, batch_id, crs_id, created_by, created_date)
                        VALUES (:time_table_id, :tt_detail_id, :section_id, :crs_id, :user_id, :now)
                        """
                    ),
                    {**params, "time_table_id": time_table_id, "tt_detail_id": tt_detail_id,
                     "user_id": user_id, "now": now},
                )

            mapping = db.execute(
                text(
                    """
                    INSERT INTO lms_tt_time_table_day_mapping
                    (time_table_id, tt_detail_id, day_id, week_day_name, class_date,
                     allot_crs_id, allot_by, extra_class_flag, extra_class_created,
                     created_by, modified_by, created_date, modified_date)
                    VALUES
                    (:time_table_id, :tt_detail_id, :day_id, :weekday, :class_date_db,
                     :crs_id, :user_id, 1, :user_id, :user_id, :user_id, :now, :now)
                    """
                ),
                {**params, "time_table_id": time_table_id, "tt_detail_id": tt_detail_id,
                 "day_id": day_id, "weekday": weekday_name, "class_date_db": class_date_db,
                 "user_id": user_id, "now": now},
            )
            tt_day_map_id = mapping.lastrowid
            message = "Extra class added successfully."

        db.commit()
        return returnSuccess(
            {"time_table_id": time_table_id, "tt_day_map_id": tt_day_map_id,
             "tt_detail_id": tt_detail_id},
            message,
        )
    except Exception as exc:
        db.rollback()
        return returnException(f"Failed to save extra class: {str(exc)}")

