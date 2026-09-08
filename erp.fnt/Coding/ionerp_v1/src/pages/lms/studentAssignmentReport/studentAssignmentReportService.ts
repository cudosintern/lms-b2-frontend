import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/lmsApiEndpoint";

export interface DropdownOption { value: string | number; label: string }
export interface ReportContext {
  academic_batch_id: number;
  semester_id: number;
  course_id: number;
  section_id: number;
}
export interface StudentReportRow {
  id: number;
  student_usn: string;
  student_name: string;
  secured_marks: number | string | null;
}

// Reject failed requests instead of displaying them as a successful empty report.
export function extractArray(response: any): any[] {
  if (response?.status === false || response?.success === false) {
    throw new Error(response.message || response.error || "Unable to load assignment report");
  }
  if (Array.isArray(response)) return response;
  if (response?.data != null) return extractArray(response.data);
  throw new Error("Invalid assignment report response");
}

async function postList(endpoint: string, payload: object, signal?: AbortSignal) {
  // Axios 1.x supports signals, but the project's legacy @types/axios does not.
  const config: NonNullable<Parameters<typeof axiosInstance.post>[2]> & { signal?: AbortSignal } = { signal };
  const response = await axiosInstance.post(endpoint, payload, config);
  return extractArray(response.data);
}

const service = {
  getCurriculumList: (signal?: AbortSignal) => postList(ApiEndpoint.topic.curriculumList, {}, signal),
  getSemesterList: (academic_batch_id: number, signal?: AbortSignal) =>
    postList(ApiEndpoint.topic.semesterList, { academic_batch_id }, signal),
  getCourseList: (academic_batch_id: number, semester_id: number, signal?: AbortSignal) =>
    postList(ApiEndpoint.topic.courseList, { academic_batch_id, semester_id }, signal),
  getSectionList: (context: Omit<ReportContext, "section_id">, signal?: AbortSignal) =>
    postList(ApiEndpoint.topic.sectionList, context, signal),
  getAssignments: async (context: ReportContext, signal?: AbortSignal): Promise<DropdownOption[]> => {
    const rows = await postList(ApiEndpoint.studentAssignmentReport.assignmentList, context, signal);
    return rows.map(item => ({
      value: item.value ?? item.lms_assignment_id ?? item.id,
      label: item.label ?? item.assignment_name ?? item.name,
    }));
  },
  getStudentReport: async (context: ReportContext & { assignment_id: number }, signal?: AbortSignal): Promise<StudentReportRow[]> => {
    const rows = await postList(ApiEndpoint.studentAssignmentReport.report, context, signal);
    return rows.map((row, index) => ({
      id: row.id ?? index + 1,
      student_usn: row.student_usn ?? "",
      student_name: String(row.student_name ?? row.name ?? "").trim() || row.student_usn || "N/A",
      secured_marks: row.secured_marks == null || String(row.secured_marks).trim() === "" || !Number.isFinite(Number(row.secured_marks)) ? null : Number(row.secured_marks),
    }));
  },
};

export const useStudentAssignmentReportService = () => service;
