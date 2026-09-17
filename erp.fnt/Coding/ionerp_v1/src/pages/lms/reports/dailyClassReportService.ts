export interface DctrOption { id: string; name: string }
export interface DctrRow {
  id: number | string;
  department: string;
  time: string;
  date: string;
  email: string;
  section: string;
  class_timings: string;
  scheduled_class: string;
  scheduled_faculty: string;
  faculty: string;
  students_present: number | null;
  total_students: number | null;
  status: string;
  attendance_scope?: string | null;
}
export function reportCell(row: DctrRow, key: keyof DctrRow): string | number {
  if (key === "students_present") {
    return row.students_present == null || row.total_students == null ? "—" : `${row.students_present}/${row.total_students}`;
  }
  return row[key] == null || row[key] === "" ? "—" : row[key]!;
}

export function classStartMinutes(value: string): number {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return -1;
  let hour = Number(match[1]);
  if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return hour * 60 + Number(match[2]);
}

export function compareReportRows(a: DctrRow, b: DctrRow, key: keyof DctrRow): number {
  if (key === "students_present") return (a.students_present ?? -1) - (b.students_present ?? -1) || (a.total_students ?? -1) - (b.total_students ?? -1);
  if (key === "class_timings") return classStartMinutes(a.class_timings || "") - classStartMinutes(b.class_timings || "");
  return String(a[key] ?? "").localeCompare(String(b[key] ?? ""), undefined, { numeric: true, sensitivity: "base" });
}
export function dctrList<T>(response: any): T[] {
  if (response?.status === false || response?.success === false) throw new Error(response.message || "Unable to load daily class report");
  if (Array.isArray(response)) return response;
  if (response?.data != null) return dctrList<T>(response.data);
  if (Array.isArray(response?.items)) return response.items;
  throw new Error("Invalid daily class report response");
}
export function csvCell(value: unknown): string {
  const raw = String(value ?? "");
  const safe = /^[\s]*[=+@-]/.test(raw) ? "'" + raw : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
