import { FormEvent, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../utils/api';
import { ApiEndpoint } from '../../../utils/ApiEndpoint/lmsApiEndpoint';
import type { Course, CourseRegistrationOverview, CourseType, SelectOption } from './CourseRegistrationTypes';
import './courseRegistrationPage.css';

const numberOrNull = (value: string) => value.trim() === '' ? null : Number(value);

type ApiResponse<T> = { status: boolean; data: T; message?: string };
type DropdownOption = { dept_id?: number; dept_name?: string; pgm_id?: number; program_name?: string; curriculum_id?: number; curriculum_name?: string; semester_id?: number; term_name?: string };
type SetupResponse = { semester: { start_date?: string; start_time?: string; end_date?: string; end_time?: string; max_credit?: number; own_elective?: number; other_elective?: number }; course_structure: Array<{ crs_type_id: number; course_type: string; total_credits: number; min_credits: number; max_credits: number; students_registered: number }> };
type EnrollmentResponse = { courses: Array<{ crs_id: number; crs_code: string; crs_title: string; total_credits: number; registered_count: number }> };

async function request<T>(url: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await axiosInstance.request({ url, method, data });
  const payload = response.data as ApiResponse<T>;
  if (!payload.status) throw new Error(payload.message ?? 'Request failed');
  return payload.data;
}

function toDateTimeInput(date?: string, time?: string) {
  if (!date || !time) return '';
  const [day, month, year] = date.split('-');
  const timeParts = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!day || !month || !year || !timeParts) return '';
  let hour = Number(timeParts[1]);
  if (timeParts[3]?.toUpperCase() === 'PM' && hour < 12) hour += 12;
  if (timeParts[3]?.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:${timeParts[2]}`;
}

function splitDateTime(value: string) {
  const [date, time] = value.split('T');
  return { date, time };
}

export function CourseRegistrationPage() {
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [programs, setPrograms] = useState<SelectOption[]>([]);
  const [curricula, setCurricula] = useState<SelectOption[]>([]);
  const [terms, setTerms] = useState<SelectOption[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [curriculumId, setCurriculumId] = useState('');
  const [termId, setTermId] = useState('');
  const [overview, setOverview] = useState<CourseRegistrationOverview | null>(null);
  const [limits, setLimits] = useState<Record<number, { minimum: string; maximum: string }>>({});
  const [totalLimit, setTotalLimit] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [courseDialog, setCourseDialog] = useState<{ type: CourseType; courses: Course[] } | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request<DropdownOption[]>(ApiEndpoint.registrationSetup.departments)
      .then((rows) => setDepartments(rows.map((row) => ({ id: row.dept_id!, name: row.dept_name! }))))
      .catch(showError);
  }, []);
  useEffect(() => {
    setPrograms([]); setProgramId(''); setCurricula([]); setCurriculumId(''); setTerms([]); setTermId(''); setOverview(null);
    if (departmentId) request<DropdownOption[]>(ApiEndpoint.registrationSetup.programs(departmentId))
      .then((rows) => setPrograms(rows.map((row) => ({ id: row.pgm_id!, name: row.program_name! }))))
      .catch(showError);
  }, [departmentId]);
  useEffect(() => {
    setCurricula([]); setCurriculumId(''); setTerms([]); setTermId(''); setOverview(null);
    if (programId) request<DropdownOption[]>(ApiEndpoint.registrationSetup.curriculums(programId))
      .then((rows) => setCurricula(rows.map((row) => ({ id: row.curriculum_id!, name: row.curriculum_name! }))))
      .catch(showError);
  }, [programId]);
  useEffect(() => {
    setTerms([]); setTermId(''); setOverview(null);
    if (curriculumId) request<DropdownOption[]>(ApiEndpoint.registrationSetup.terms(curriculumId))
      .then((rows) => setTerms(rows.map((row) => ({ id: row.semester_id!, name: row.term_name! }))))
      .catch(showError);
  }, [curriculumId]);
  useEffect(() => { if (curriculumId && termId) loadOverview(); }, [curriculumId, termId]);

  function showError(reason: unknown) { setError(reason instanceof Error ? reason.message : 'Something went wrong'); setNotice(''); }
  async function loadOverview() {
    try {
      setError('');
      const setup = await request<SetupResponse>(ApiEndpoint.registrationSetup.getSetup(termId));
      const data: CourseRegistrationOverview = {
        credits_mode: true,
        header: { curriculum_name: curricula.find((item) => String(item.id) === curriculumId)?.name ?? '', term_name: terms.find((item) => String(item.id) === termId)?.name ?? '', available_total: setup.course_structure.reduce((total, item) => total + item.total_credits, 0), total_crs_enroll: setup.semester.max_credit ?? 0 },
        course_types: setup.course_structure.map((item) => ({ course_type_id: item.crs_type_id, name: item.course_type, alias: item.course_type, total: item.total_credits, minimum_available: 0, minimum: item.min_credits, maximum: item.max_credits, registered: item.students_registered })),
      };
      setOverview(data);
      setTotalLimit(String(setup.semester.max_credit ?? ''));
      setStartsAt(toDateTimeInput(setup.semester.start_date, setup.semester.start_time));
      setEndsAt(toDateTimeInput(setup.semester.end_date, setup.semester.end_time));
      setLimits(Object.fromEntries(data.course_types.map((item: CourseType) => [item.course_type_id, { minimum: String(item.minimum ?? ''), maximum: String(item.maximum ?? '') }])));
    } catch (reason) { showError(reason); }
  }

  const minimumTotal = useMemo(() => Object.values(limits).reduce((sum, item) => sum + (Number(item.minimum) || 0), 0), [limits]);
  async function saveSetup(event: FormEvent) {
    event.preventDefault();
    if (!overview) return;
    try {
      setSaving(true); setError('');
      const start = splitDateTime(startsAt);
      const end = splitDateTime(endsAt);
      await request(ApiEndpoint.registrationSetup.updateSetup, 'POST', {
        academic_batch_id: Number(curriculumId), semester_id: Number(termId),
        enroll_start_date: start.date, enroll_start_time: start.time,
        enroll_end_date: end.date, enroll_end_time: end.time,
        total_crs_enroll: Number(totalLimit), own_crclm_elective: 0, other_crclm_elective: 0,
        course_limits: overview.course_types.map((type) => ({
          crs_type_id: type.course_type_id, crs_type_total: type.total,
          stud_min_crs_enroll: Number(limits[type.course_type_id]?.minimum), stud_max_crs_enroll: Number(limits[type.course_type_id]?.maximum),
        })),
      });
      setNotice('Registration setup saved.'); await loadOverview();
    } catch (reason) { showError(reason); } finally { setSaving(false); }
  }

  async function openCourseDialog(type: CourseType) {
    try {
      const details = await request<EnrollmentResponse>(ApiEndpoint.registrationSetup.enrollmentDetails(termId, type.name));
      setCourseDialog({ type, courses: details.courses.map((course) => ({ course_id: course.crs_id, code: course.crs_code, title: course.crs_title, credits: course.total_credits, student_limit: null, registered: course.registered_count, reg_start_date: null, reg_end_date: null, course_type_name: type.name, course_type_alias: type.alias })) });
    } catch (reason) { showError(reason); }
  }

  return <main className="page">
    <header><h1>Student Course Registration</h1><p>Set the registration window and the course or credit limits for a curriculum term.</p></header>
    {error && <div className="alert error">{error}</div>}{notice && <div className="alert success">{notice}</div>}
    <section className="card selectors">
      <label>Department<select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Program<select value={programId} onChange={(e) => setProgramId(e.target.value)} disabled={!departmentId}><option value="">Select program</option>{programs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Curriculum<select value={curriculumId} onChange={(e) => setCurriculumId(e.target.value)} disabled={!programId}><option value="">Select curriculum</option>{curricula.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Term<select value={termId} onChange={(e) => setTermId(e.target.value)} disabled={!curriculumId}><option value="">Select term</option>{terms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </section>
    {overview && <form className="card" onSubmit={saveSetup}>
      <div className="summary"><strong>{String(overview.header.curriculum_name)} · {String(overview.header.term_name)}</strong><span>Total available {overview.credits_mode ? 'credits' : 'courses'}: <b>{String(overview.header.available_total)}</b></span></div>
      <div className="setup-fields">
        <label>Registration starts<input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></label>
        <label>Registration ends<input type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} /></label>
        <label>Total {overview.credits_mode ? 'credits' : 'courses'} per student<input type="number" min="1" step={overview.credits_mode ? '0.1' : '1'} required value={totalLimit} onChange={(e) => setTotalLimit(e.target.value)} /></label>
      </div>
      <table><thead><tr><th>Course type</th><th>Available</th><th>Minimum</th><th>Maximum</th><th>Registered</th><th /></tr></thead><tbody>
        {overview.course_types.map((type) => <tr key={type.course_type_id}><td>{type.name}</td><td>{type.total}</td>
          <td><input aria-label={`${type.name} minimum`} type="number" min={type.minimum_available} max={type.total} step={overview.credits_mode ? '0.1' : '1'} required value={limits[type.course_type_id]?.minimum ?? ''} onChange={(e) => setLimits({ ...limits, [type.course_type_id]: { ...limits[type.course_type_id], minimum: e.target.value } })} /></td>
          <td><input aria-label={`${type.name} maximum`} type="number" min={type.minimum_available} max={type.total} step={overview.credits_mode ? '0.1' : '1'} required value={limits[type.course_type_id]?.maximum ?? ''} onChange={(e) => setLimits({ ...limits, [type.course_type_id]: { ...limits[type.course_type_id], maximum: e.target.value } })} /></td>
          <td>{type.registered}</td><td><button type="button" className="link" onClick={() => openCourseDialog(type)}>Course limits</button></td></tr>)}
      </tbody></table>
      <p className={minimumTotal > Number(totalLimit) ? 'validation error-text' : 'validation'}>Sum of minimums: {minimumTotal} {minimumTotal > Number(totalLimit) ? '— cannot exceed the total limit.' : ''}</p>
      <div className="actions"><button disabled={saving || minimumTotal > Number(totalLimit)}>{saving ? 'Saving…' : 'Save setup'}</button></div>
    </form>}
    {courseDialog && <div className="backdrop" role="presentation"><section className="dialog"><h2>{courseDialog.type.name}: enrollment details</h2>
      <table><thead><tr><th>Code</th><th>Course</th>{overview?.credits_mode && <th>Credits</th>}<th>Student limit</th>{courseDialog.type.alias === 'OPEN_ELECTIVE' && <><th>Course starts</th><th>Course ends</th></>}<th>Registered</th></tr></thead><tbody>
        {courseDialog.courses.map((course) => <tr key={course.course_id}><td>{course.code}</td><td>{course.title}</td>{overview?.credits_mode && <td>{course.credits}</td>}<td>{course.student_limit ?? '-'}</td>
          {courseDialog.type.alias === 'OPEN_ELECTIVE' && <><td>{course.reg_start_date ?? '-'}</td><td>{course.reg_end_date ?? '-'}</td></>}<td>{course.registered}</td></tr>)}
      </tbody></table><div className="actions"><button type="button" className="secondary" onClick={() => setCourseDialog(null)}>Close</button></div></section></div>}
  </main>;
}

export default CourseRegistrationPage;
