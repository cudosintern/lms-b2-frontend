# Manage Topic Instructor migration

## Implemented

- Uses the supplied models: `cudos_topic.crs_id`, `iems_academic_batch`, `iems_semester`, `iems_courses`, `cudos_map_courseto_course_instructor`, `cudos_master_type_details`, and `iems_students`.
- Cascading filters clear dependent selections and ignore stale responses. Existing unfiltered dropdown callers remain supported.
- Multiple instructors per topic, course/section instructor validation, idempotent assignment, and transactional imports.
- Copies source portions from `cudos_topic_lesson_schedule`, with a fallback for the legacy `topic_lesson_schedule` table. New section portions are generated when no source exists.
- Topic creation also creates its instructor mapping and portions in one transaction. New topics can be added to an empty list.
- Section-specific lecture numbers, text, planned/actual dates, delivery times, timetable slot choices, additional rows, and extra classes.
- Batch schedule save is atomic. Cancel discards unsaved schedule edits. Blank dates clear stored values.
- Calendar updates use `lms_ls_lesson_schedule_map` and `lms_ls_topic_map`; student links use `iems_students` and `cudos_map_courseto_student`. Changing/clearing delivery removes the old portion link; the old calendar entry remains in progress, as in the legacy module.
- Single/bulk removal deletes section instructor assignments only, preserving shared topics, portions, and calendar history for reimport.
- API failures propagate to the UI instead of producing false success messages.

## Files and integration

Frontend files are updated in this folder. The following backend files have also been applied and hash-verified in the existing FastAPI module; review copies and tests remain in `backend_changes/`:

- `topic_routes.py` replaces the existing router.
- `topic_schema.py` replaces its schemas.
- `topic_calendar.py` is a new helper alongside the router.

The existing `/api/v1/topic_management` router registration is reused. No database DDL or data migration is required. The schedule API now identifies a section portion by `lms_map_portion_ls.mtp_id`; source lesson schedule IDs remain separate. Deploy the frontend and backend together.

## Verification

- 10 isolated SQLite backend regressions: multiple assignments, repeat imports, academic context, section isolation, invalid instructor rollback, atomic schedule save, date clearing, calendar/student idempotency, removal scope, new topics, and extra classes.
- 6 frontend service tests: request bodies, error propagation, clearing dates, draft IDs, removal context, and response formats.
- TypeScript diagnostics for this module: zero errors.
- Read-only smoke checks against the configured local database passed for list and schedule endpoints. Calendar and student-link columns were inspected directly because the shared ORM models do not cover all those tables. No application records were changed by verification.
- Full-project TypeScript check remains blocked by the installed `react-hook-form` declarations using syntax unsupported by the project's TypeScript 4.9 compiler.

## Remaining integration limits

- The existing shared `get_current_user` dependency has authentication explicitly disabled and returns a test user. This module uses that dependency, so legacy role/organization restrictions and production audit identity are not yet equivalent. That shared authentication/RBAC configuration needs a separate coordinated fix; this migration must not be described as production permission parity.
- Timetable slots are offered in the form; manual dates/times are also supported. The legacy date-picker-only restriction is not enforced server-side.
- Filter selections are remembered in browser session storage; the legacy shared PHP department/program session is not used.
- Browser interaction against the running React app and live database mutation tests were not performed.

## Screenshot workflow alignment (6 September 2026)

Compared the supplied v11_3 PHP zip with v11_2: PHP/JavaScript functionality matches after whitespace normalization.

Implemented the grouped topic/portion table, Assign Topic to Course Instructor modal, full-page lesson editor, Add More with deletion limited to new rows, and timetable-based delivery-time choices. Instructor additions and schedule updates save in one backend transaction. Topics without source portions are marked in the import modal.

Extra Class navigates to /lms/timetable-calendar with the selected batch, semester, course and section, then opens the existing Extra Class form. Unsaved editor rows are stored in sessionStorage and restored when that topic editor is reopened. Save and Cancel clear the draft.

Validation: 14 frontend regression tests and 14 isolated backend regression tests pass; scoped TypeScript check reports zero diagnostics. A real-browser visual comparison has not been run. The repository-wide TypeScript check remains blocked by the existing TypeScript/react-hook-form declaration compatibility issue.

Reviewed backend and calendar candidates, original snapshots, and application script are retained under backend_changes/ui_v11_3. The application script checks file hashes before overwriting to preserve concurrent user edits.
