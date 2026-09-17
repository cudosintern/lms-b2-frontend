# Course registration configuration

Default React page for the LMS `course-registration-setup` route. Uses the existing Axios client (`src/utils/api.ts`) and the new `/course-registration-configuration` FastAPI endpoints. No additional runtime dependencies.

Features: department/program/curriculum/term selection, remembered filters, credit or course limits, term windows, own/other elective limits in credit mode, elective-course capacity dialog, open-elective date windows, read-only core-course details, save/update/cancel, registered counts and PDF export.

Credit mode is the requested default. Save term changes before editing course limits or exporting. Blank course capacity means unlimited; zero is a real limit. Dates are institution-local. Validation errors preserve unsaved inputs. Selection changes prompt before discarding edits, and browser unload warns about unsaved main-form edits.

See the backend module README for authentication, schema mapping, settings overrides and validation rules. The existing application's API URL and login must be configured. Tests in `CourseRegistrationConfiguration.test.tsx` mock network calls and do not change records.
