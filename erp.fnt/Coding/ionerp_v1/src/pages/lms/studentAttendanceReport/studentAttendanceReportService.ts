import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

export interface AttendanceOption { value: string; label: string }
export interface AttendanceLessonDatesParams {
  academic_batch_id: string; semester_id: string; course_id: string; section_id: string;
}
export interface AttendanceSummaryParams extends AttendanceLessonDatesParams {
  from_date: string; to_date: string; only_present: boolean;
}
export interface AttendanceSummaryRow {
  id: string; usn: string; name: string; present: number; absent: number;
  dates: Record<string, string>;
}
async function post<T>(url: string, payload: object): Promise<T> {
  const response = await axiosInstance.post(url, payload);
  const body = response.data as { success?: boolean; status?: boolean | string; message?: string; data?: T } | null;
  if (body == null || body.success === false || body.status === false || body.status === "error") {
    throw new Error(body?.message || "Unable to load attendance data");
  }
  return (body.data ?? body) as T;
}
async function options(url: string, payload: object): Promise<AttendanceOption[]> {
  const rows = await post<AttendanceOption[]>(url, payload);
  if (!Array.isArray(rows)) throw new Error("Invalid dropdown response");
  return rows.map(row => ({ value: String(row.value), label: row.label }));
}
export const fetchAttendanceCurriculums = () => options(ApiEndpoint.topic.curriculumList, {});
export const fetchAttendanceTerms = (batch: string) => options("/api/v1/student_attendance_report/terms", { academic_batch_id: Number(batch) });
export async function fetchAttendanceCourses(batch: string, term: string): Promise<AttendanceOption[]> {
  const rows = await post<{ crs_id: number; crs_code: string; crs_title: string }[]>("/api/v1/attendance/courses", {
    academic_batch_id: Number(batch), semester_id: Number(term),
  });
  if (!Array.isArray(rows)) throw new Error("Invalid courses response");
  return rows.map(row => ({ value: String(row.crs_id), label: `${row.crs_code} - ${row.crs_title}` }));
}
export const fetchAttendanceSections = (batch: string, term: string, course: string) => options(ApiEndpoint.topic.sectionList, {
  academic_batch_id: Number(batch), semester_id: Number(term), course_id: Number(course),
});
export async function fetchAttendanceSummary(params: AttendanceSummaryParams): Promise<AttendanceSummaryRow[]> {
  const rows = await post<AttendanceSummaryRow[]>("/api/v1/student_attendance_report/summary", {
    academic_batch_id: Number(params.academic_batch_id), semester_id: Number(params.semester_id),
    course_id: Number(params.course_id), section_id: Number(params.section_id),
    from_date: params.from_date, to_date: params.to_date,
  });
  if (!Array.isArray(rows) || rows.some(row => !row.dates || typeof row.dates !== "object")) {
    throw new Error("Invalid student attendance response");
  }
  return rows;
}

export function getReportDates(from: string, to: string, onlyPresent: boolean, rows: AttendanceSummaryRow[]): string[] {
  if (!from || !to || from > to) return [];
  if (onlyPresent) return Array.from(new Set(rows.flatMap(row => Object.keys(row.dates)))).filter(date => date >= from && date <= to).sort();
  const dates: string[] = [];
  const day = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (day <= end) { dates.push(day.toISOString().slice(0, 10)); day.setUTCDate(day.getUTCDate() + 1); }
  return dates;
}
