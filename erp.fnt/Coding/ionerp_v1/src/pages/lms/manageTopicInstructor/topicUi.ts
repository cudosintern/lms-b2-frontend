export type InstructorOption = { value: number; label: string };
export type TopicPortion = {
  schedule_id: number; lesson_schedule_id?: number | null; session_number: number;
  portion_to_be_covered: string; conduction_date?: string | null;
  actual_delivery_date?: string | null; start_time?: string | null; end_time?: string | null;
};
export type TopicLabels = { curriculum: string; semester: string; course: string; section: string };
export const isoDate = (value?: string | null) => {
  const date = (value || "").trim().split(/[T\s]/)[0];
  if (/^\d{2}-\d{2}-\d{4}$/.test(date)) return date.split("-").reverse().join("-");
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
};
export const displayDate = (value?: string | null) => isoDate(value).split("-").reverse().join("-");
export const clockTime = (value?: string | null) => (value || "").slice(0, 5);
export const displayTime = (value?: string | null) => {
  if (!value) return "";
  const [hour, minute] = clockTime(value).split(":");
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) >= 12 ? "PM" : "AM"}`;
};
export function extraClassUrl(context: { academic_batch_id: number; semester_id: number; course_id: number; section_id: number }) {
  return `/lms/timetable-calendar?${new URLSearchParams({ open_extra_class: "true", ...Object.fromEntries(Object.entries(context).map(([key, value]) => [key, String(value)])) })}`;
}
export function readTopicCalendarRequest(search: string) {
  const params = new URLSearchParams(search);
  if (params.get("open_extra_class") !== "true") return null;
  const values = ["academic_batch_id", "semester_id", "course_id", "section_id"].map(key => params.get(key) || "");
  if (!values.every(value => /^[1-9]\d*$/.test(value))) return null;
  return { batch: values[0], term: values[1], course: values[2], section: values[3] };
}
